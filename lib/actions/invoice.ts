"use server";

import { IInvoice, IPayInfo } from "@/types/invoice";
import { authenticate, _authenticate, UserCtx } from "@/lib/prechecks/auth";
import { calculateShare, Invoice } from "@/models/Invoice";
import { serializeDocument } from "@/lib/serializer";
import {
    _verifyMembership,
    _verifyRoomPermission,
    verifyMembership,
    VerifyMembershipCtx,
    verifyRoomPermission,
    VerifyRoomPermissionCtx,
} from "@/lib/prechecks/room";
import {
    sendDeleteInvoiceNotification,
    sendNewInvoiceNotification,
    sendUpdateInvoiceNotification,
} from "@/lib/messages/invoice";
import {
    createErrorResponse,
    createSuccessResponse,
    handleServerActionError,
    serverAction,
} from "../actions-helper";
import { ErrorCode } from "@/enums/error";
import { ServerActionResponse } from "@/types/actions";
import { MemberRole } from "@/enums/member-role";
import { AppError, AppValidationError } from "../errors";
import { DecodedIdToken } from "@/types/auth";
import { revalidateTag } from "next/cache";
import { IMembership } from "@/types/membership";
import mongoose from "mongoose";

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
}

export const createNewInvoice = serverAction<
    (data: CreateInvoiceFormData) => Promise<IInvoice>
>({
    initContext: (ctx, data) => {
        ctx.roomId = data.roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
    fn: async function (ctx: { user: DecodedIdToken }, data) {
        const invoice = await new Invoice({
            ...data,
            status: "pending",
            createdBy: ctx.user.uid,
        }).save();

        await sendNewInvoiceNotification(invoice);

        revalidateTag(`invoices-${invoice.roomId}`);
        return serializeDocument<IInvoice>(invoice);
    },
});

export interface UpdateInvoiceFormData extends Partial<CreateInvoiceFormData> {
    invoiceId: string;
}

export const updateInvoice = serverAction<
    (data: UpdateInvoiceFormData) => Promise<IInvoice>
>({
    initContext: (ctx, data) => {
        ctx.roomId = data.roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
    fn: async function (ctx: { user: DecodedIdToken }, data) {
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
});

interface GetRoomInvoicesQuery {
    status?: IInvoice["status"];
}
export const getInvoicesByRoom = serverAction<
    (roomId: string, query?: GetRoomInvoicesQuery) => Promise<IInvoice[]>
>({
    initContext: (ctx, roomId) => {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
    fn: async function (_, roomId, query = { status: "pending" }) {
        const invoices = await Invoice.find({
            roomId: roomId,
            status: query.status,
        }).sort({ monthApplied: -1 });

        return serializeDocument<IInvoice[]>(invoices);
    },
    cache: (ctx, roomId) => ({
        tags: [`invoices-${roomId}`],
    }),
});

export const deleteInvoice = serverAction<(invoiceId: string) => Promise<null>>(
    {
        initContext: (ctx) =>
            (ctx.requiredRoles = [MemberRole.ADMIN, MemberRole.MODERATOR]),

        prechecks: [_authenticate],

        fn: async function (
            ctx: {
                user: DecodedIdToken;
                roomId: string;
                membership: mongoose.Document & IMembership;
                requiredRoles: MemberRole[];
            },
            invoiceId
        ) {
            const invoice = await Invoice.findById(invoiceId);

            if (!invoice) {
                throw new AppError(
                    "Không tìm thấy hóa đơn",
                    ErrorCode.NOT_FOUND
                );
            }

            ctx.roomId = invoice.roomId;

            await _verifyMembership(ctx);
            _verifyRoomPermission(ctx);

            await Invoice.findByIdAndDelete(invoiceId);

            revalidateTag(`invoices-${invoice.roomId}`);

            await sendDeleteInvoiceNotification(invoice, ctx.user.uid);

            return null;
        },
    }
);

export const payInvoice = serverAction<
    (invoiceId: string, amount: number) => Promise<IInvoice>
>({
    prechecks: [_authenticate],
    fn: async function (ctx: UserCtx & VerifyMembershipCtx, invoiceId, amount) {
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            throw new AppError("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
        }

        ctx.roomId = invoice.roomId;

        await _verifyMembership(ctx);

        const totalAmountToPay = await calculateShare(invoice, ctx.user.uid);
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
});
