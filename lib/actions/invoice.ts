"use server";

import { IInvoice, IPayInfo } from "@/types/invoice";
import { _authenticate, UserCtx } from "@/lib/prechecks/auth";
import { Invoice } from "@/models/Invoice";
import { serializeDocument } from "@/lib/serializer";
import {
    _verifyMembership,
    _verifyRoomPermission,
    VerifyMembershipCtx,
    VerifyRoomPermissionCtx,
} from "@/lib/prechecks/room";
import {
    sendDeleteInvoiceNotification,
    sendNewInvoiceNotification,
    sendUpdateInvoiceNotification,
} from "@/lib/messages/invoice";
import { serverAction } from "../actions-helper";
import { ErrorCode } from "@/enums/error";
import { MemberRole } from "@/enums/member-role";
import { AppError } from "../errors";
import { revalidateTag } from "next/cache";
import { RootFilterQuery } from "mongoose";
import { InvoiceSplitMethod } from "@/enums/invoice";
import { calculateShare } from "@/lib/utils";
import { MonthPresence } from "@/models/MonthPresence";

export interface CreateInvoiceFormData {
    roomId: string;
    amount: number;
    type: IInvoice["type"];
    monthApplied?: string;
    name: string;
    description: string;
    dueDate?: Date;
    applyTo: string[];
    advancePayer?: IPayInfo;
    payTo?: string;
    splitMethod: InvoiceSplitMethod;
    splitMap: Record<string, number>;
}

export const createNewInvoice = serverAction({
    fn: async function (
        ctx: VerifyMembershipCtx,
        data: CreateInvoiceFormData
    ): Promise<IInvoice> {
        const invoice = await new Invoice({
            ...data,
            status: "pending",
            createdBy: ctx.user.uid,
        }).save();

        await sendNewInvoiceNotification(invoice);

        revalidateTag(`invoices-${invoice.roomId}`);
        return serializeDocument<IInvoice>(invoice);
    },
    initContext: (ctx, data) => {
        ctx.roomId = data.roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
});

export interface UpdateInvoiceFormData extends Partial<CreateInvoiceFormData> {
    invoiceId: string;
}

export const updateInvoice = serverAction({
    fn: async function (
        ctx: VerifyMembershipCtx,
        data: UpdateInvoiceFormData
    ): Promise<IInvoice> {
        const invoice = await Invoice.findById(data.invoiceId);
        if (!invoice) {
            throw new AppError("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
        }

        Object.assign(invoice, data);
        await invoice.save();

        await sendUpdateInvoiceNotification(invoice, ctx.user.uid);

        revalidateTag(`invoices-${invoice.roomId}`);
        return serializeDocument<IInvoice>(invoice);
    },
    initContext: (ctx, data) => {
        ctx.roomId = data.roomId!;
    },
    prechecks: [_authenticate, _verifyMembership],
});

interface GetRoomInvoicesQuery {
    status?: IInvoice["status"];
    shouldLimit?: boolean;
    sortBy?: "createdAt" | "monthApplied";
    sortOrder?: "asc" | "desc";
    cursor?: string | null;
}
export const getInvoicesByRoom = serverAction({
    fn: async function (
        _,
        roomId: string,
        query: GetRoomInvoicesQuery = {
            status: "pending",
            sortBy: "createdAt",
            sortOrder: "desc",
        }
    ): Promise<IInvoice[]> {
        const filter: RootFilterQuery<IInvoice> = {
            roomId: roomId,
            status: query.status,
        };

        if (query.cursor) {
            filter[query.sortBy || "createdAt"] =
                query.sortOrder === "asc"
                    ? { $gt: query.cursor }
                    : { $lt: query.cursor };
        }

        const invoices = await Invoice.find(filter)
            .limit(query.shouldLimit ? 20 : 0)
            .sort({
                [query.sortBy || "createdAt"]:
                    query.sortOrder === "asc" ? 1 : -1,
            });

        return serializeDocument<IInvoice[]>(invoices, {
            // Disabled because the bug of splitMap contains unexpected $* key
            schemaFieldsOnly: false,
        });
    },
    initContext: (ctx, roomId) => {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
    cache: (ctx, roomId,query) => ({
        tags: [`invoices-${roomId}`, `invoices-${query?.status}-${roomId}`],
    }),
});

export const deleteInvoice = serverAction({
    fn: async function (
        ctx: VerifyRoomPermissionCtx,
        invoiceId: string
    ): Promise<null> {
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            throw new AppError("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
        }

        ctx.roomId = invoice.roomId;

        await _verifyMembership(ctx);
        if (ctx.user.uid !== invoice.createdBy) _verifyRoomPermission(ctx);

        await Invoice.findByIdAndDelete(invoiceId);

        revalidateTag(`invoices-${invoice.roomId}`);

        await sendDeleteInvoiceNotification(invoice, ctx.user.uid);

        return null;
    },
    initContext(ctx) {
        ctx.requiredRoles = [MemberRole.ADMIN, MemberRole.MODERATOR];
    },

    prechecks: [_authenticate],
});

export const payInvoice = serverAction({
    fn: async function (
        ctx: UserCtx & VerifyMembershipCtx,
        invoiceId: string,
        amount: number
    ): Promise<IInvoice> {
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            throw new AppError("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
        }

        ctx.roomId = invoice.roomId;

        await _verifyMembership(ctx);

        const [totalAmountToPay, isPayable] = calculateShare(
            invoice,
            ctx.user.uid,
            invoice.splitMethod === InvoiceSplitMethod.BY_PRESENCE
                ? await MonthPresence.find({
                      roomId: invoice.roomId,
                      month: invoice.monthApplied,
                  })
                : []
        );

        if (!isPayable) {
            throw new AppError(
                "Bạn hoặc các thành viên chưa hoàn thành điểm danh, không thể thanh toán hóa đơn này.",
                ErrorCode.FORBIDDEN
            );
        }

        const userPayInfo = invoice.payInfo?.find(
            (pi) => pi.paidBy === ctx.user.uid
        );

        if (userPayInfo) {
            if (userPayInfo.amount >= totalAmountToPay) {
                throw new AppError(
                    "Bạn đã thanh toán hóa đơn này rồi",
                    ErrorCode.FORBIDDEN
                );
            }

            userPayInfo.amount = Math.min(
                userPayInfo.amount + amount,
                Math.round(totalAmountToPay)
            );
            userPayInfo.paidAt = new Date();
        } else {
            invoice.payInfo.push({
                paidBy: ctx.user.uid,
                amount: Math.min(amount, Math.round(totalAmountToPay)),
                paidAt: new Date(),
            });
        }

        await invoice.save();

        revalidateTag(`invoices-${invoice.roomId}`);

        return serializeDocument<IInvoice>(invoice);
    },
    prechecks: [_authenticate],
});
