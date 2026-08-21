"use server";

import { z } from "zod";
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
import mongoose, { RootFilterQuery } from "mongoose";
import { InvoiceSplitMethod } from "@/enums/invoice";
import { calculateShare } from "@/lib/utils";
import { MonthPresence } from "@/models/MonthPresence";
import { Room } from "@/models/Room";
import { logRoomActivity } from "@/lib/actions/room-activity";
import { RoomActivityType } from "@/enums/room-activity";

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

const YYYY_MM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const invoiceTypeSchema = z.enum(["walec", "other", "roomCost"]);
const splitMethodSchema = z.enum([
    InvoiceSplitMethod.BY_EQUALLY,
    InvoiceSplitMethod.BY_PRESENCE,
    InvoiceSplitMethod.BY_FIXED_AMOUNT,
    InvoiceSplitMethod.BY_PERCENTAGE,
]);

// Server-only whitelist of what a client is ever allowed to set on an invoice.
// Deliberately excludes status/createdBy/payInfo, which the server controls.
const payInfoInputSchema = z
    .object({
        paidBy: z.string().min(1),
        paidAt: z.coerce.date(),
        amount: z.coerce.number().nonnegative(),
    })
    .strict();

const createInvoiceInputSchema = z
    .object({
        roomId: z.string().min(1, "ID phòng là bắt buộc"),
        amount: z.coerce.number().positive("Số tiền phải lớn hơn 0"),
        type: invoiceTypeSchema,
        monthApplied: z
            .string()
            .regex(YYYY_MM_REGEX, "Định dạng tháng không hợp lệ")
            .optional(),
        name: z.string().min(1, "Tên là bắt buộc").max(50),
        description: z.string().max(150),
        dueDate: z.coerce.date().optional(),
        applyTo: z
            .array(z.string().min(1))
            .min(1, "Phải áp dụng cho ít nhất một người"),
        advancePayer: payInfoInputSchema.optional(),
        payTo: z.string().max(1024).optional(),
        splitMethod: splitMethodSchema,
        splitMap: z.record(z.string(), z.coerce.number()).default({}),
    })
    .strict();

const updateInvoiceInputSchema = z
    .object({
        invoiceId: z.string().min(1, "ID hóa đơn là bắt buộc"),
        // Accepted but never trusted for authorization - see updateInvoice.
        roomId: z.string().min(1).optional(),
        amount: z.coerce.number().positive("Số tiền phải lớn hơn 0").optional(),
        type: invoiceTypeSchema.optional(),
        monthApplied: z
            .string()
            .regex(YYYY_MM_REGEX, "Định dạng tháng không hợp lệ")
            .optional(),
        name: z.string().min(1).max(50).optional(),
        description: z.string().max(150).optional(),
        dueDate: z.coerce.date().optional(),
        applyTo: z
            .array(z.string().min(1))
            .min(1, "Phải áp dụng cho ít nhất một người")
            .optional(),
        advancePayer: payInfoInputSchema.optional(),
        payTo: z.string().max(1024).optional(),
        splitMethod: splitMethodSchema.optional(),
        splitMap: z.record(z.string(), z.coerce.number()).optional(),
    })
    .strict();

const EDITABLE_INVOICE_FIELDS = [
    "amount",
    "type",
    "monthApplied",
    "name",
    "description",
    "dueDate",
    "applyTo",
    "advancePayer",
    "payTo",
    "splitMethod",
    "splitMap",
] as const;

async function assertApplyToAreRoomMembers(roomId: string, applyTo: string[]) {
    const room = await Room.findById(roomId).select("members").lean();
    if (!room) {
        throw new AppError("Phòng không tồn tại", ErrorCode.NOT_FOUND);
    }
    const memberSet = new Set(room.members);
    const nonMembers = applyTo.filter((uid) => !memberSet.has(uid));
    if (nonMembers.length > 0) {
        throw new AppError(
            "Chỉ có thể áp dụng hóa đơn cho thành viên trong phòng",
            ErrorCode.INVALID_INPUT
        );
    }
}

export const createNewInvoice = serverAction({
    fn: async function (
        ctx: VerifyMembershipCtx,
        data: CreateInvoiceFormData
    ): Promise<IInvoice> {
        await assertApplyToAreRoomMembers(data.roomId, data.applyTo);

        const invoice = await new Invoice({
            roomId: data.roomId,
            amount: data.amount,
            type: data.type,
            monthApplied: data.monthApplied,
            name: data.name,
            description: data.description,
            dueDate: data.dueDate,
            applyTo: data.applyTo,
            advancePayer: data.advancePayer,
            payTo: data.payTo,
            splitMethod: data.splitMethod,
            splitMap: data.splitMap,
            status: "pending",
            createdBy: ctx.user.uid,
        }).save();

        await sendNewInvoiceNotification(invoice);
        await logRoomActivity({
            roomId: data.roomId,
            actorId: ctx.user.uid,
            type: RoomActivityType.INVOICE_CREATED,
            payload: { invoiceId: invoice._id.toString(), name: invoice.name },
        });

        revalidateTag(`invoices-${invoice.roomId}`);
        return serializeDocument<IInvoice>(invoice);
    },
    input: (data) => createInvoiceInputSchema.parse(data),
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
        ctx: UserCtx & Partial<VerifyMembershipCtx>,
        data: UpdateInvoiceFormData
    ): Promise<IInvoice> {
        const invoice = await Invoice.findById(data.invoiceId);
        if (!invoice) {
            throw new AppError("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
        }

        // Room membership/permission must be derived from the invoice's actual
        // room, never from client-supplied data.roomId (which could name a
        // different room the caller belongs to while targeting this invoice).
        ctx.roomId = invoice.roomId;
        await _verifyMembership(ctx as VerifyMembershipCtx);

        if (ctx.user.uid !== invoice.createdBy) {
            _verifyRoomPermission({
                ...(ctx as VerifyMembershipCtx),
                requiredRoles: [MemberRole.ADMIN, MemberRole.MODERATOR],
            });
        }

        if (data.applyTo) {
            await assertApplyToAreRoomMembers(invoice.roomId, data.applyTo);
        }

        for (const field of EDITABLE_INVOICE_FIELDS) {
            if (data[field] !== undefined) {
                (invoice as any)[field] = data[field];
            }
        }

        await invoice.save();

        await sendUpdateInvoiceNotification(invoice, ctx.user.uid);
        await logRoomActivity({
            roomId: invoice.roomId,
            actorId: ctx.user.uid,
            type: RoomActivityType.INVOICE_UPDATED,
            payload: { invoiceId: invoice._id.toString(), name: invoice.name },
        });

        revalidateTag(`invoices-${invoice.roomId}`);
        return serializeDocument<IInvoice>(invoice);
    },
    input: (data) => updateInvoiceInputSchema.parse(data),
    prechecks: [_authenticate],
});

interface GetRoomInvoicesQuery {
    status?: IInvoice["status"];
    shouldLimit?: boolean;
    sortBy?: "createdAt" | "monthApplied";
    sortOrder?: "asc" | "desc";
    cursor?: string | null;
}

const getInvoicesQuerySchema = z
    .object({
        status: z.enum(["pending", "paid", "overdue"]).optional(),
        shouldLimit: z.boolean().optional(),
        sortBy: z.enum(["createdAt", "monthApplied"]).optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        cursor: z.string().nullable().optional(),
    })
    .strict();

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
    input: (roomId, query) => {
        z.string().min(1).parse(roomId);
        if (query !== undefined) getInvoicesQuerySchema.parse(query);
    },
    initContext: (ctx, roomId) => {
        ctx.roomId = roomId;
    },
    prechecks: [_authenticate, _verifyMembership],
    cache: (ctx, roomId, query) => ({
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
        await logRoomActivity({
            roomId: invoice.roomId,
            actorId: ctx.user.uid,
            type: RoomActivityType.INVOICE_DELETED,
            payload: { invoiceId: invoice._id.toString(), name: invoice.name },
        });

        return null;
    },
    input: (invoiceId) => {
        z.string().min(1).parse(invoiceId);
    },
    initContext(ctx) {
        ctx.requiredRoles = [MemberRole.ADMIN, MemberRole.MODERATOR];
    },

    prechecks: [_authenticate],
});

export const payInvoice = serverAction({
    fn: async function (
        ctx: UserCtx & Partial<VerifyMembershipCtx>,
        invoiceId: string,
        amount: number
    ): Promise<IInvoice> {
        const session = await mongoose.startSession();

        const invoice = await session.withTransaction(async () => {
            const invoice = await Invoice.findById(invoiceId).session(session);

            if (!invoice) {
                throw new AppError("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
            }

            ctx.roomId = invoice.roomId;
            await _verifyMembership(ctx as VerifyMembershipCtx);

            const [totalAmountToPay, isPayable] = calculateShare(
                invoice,
                ctx.user.uid,
                invoice.splitMethod === InvoiceSplitMethod.BY_PRESENCE
                    ? await MonthPresence.find({
                          roomId: invoice.roomId,
                          month: invoice.monthApplied,
                      }).session(session)
                    : []
            );

            if (!isPayable) {
                throw new AppError(
                    "Bạn hoặc các thành viên chưa hoàn thành điểm danh, không thể thanh toán hóa đơn này.",
                    ErrorCode.FORBIDDEN
                );
            }

            const roundedShare = Math.round(totalAmountToPay);
            const userPayInfo = invoice.payInfo?.find(
                (pi) => pi.paidBy === ctx.user.uid
            );

            if (userPayInfo) {
                if (userPayInfo.amount >= roundedShare) {
                    throw new AppError(
                        "Bạn đã thanh toán hóa đơn này rồi",
                        ErrorCode.FORBIDDEN
                    );
                }

                userPayInfo.amount = Math.min(
                    userPayInfo.amount + amount,
                    roundedShare
                );
                userPayInfo.paidAt = new Date();
            } else {
                invoice.payInfo.push({
                    paidBy: ctx.user.uid,
                    amount: Math.min(amount, roundedShare),
                    paidAt: new Date(),
                });
            }

            await invoice.save({ session });

            return invoice;
        });

        revalidateTag(`invoices-${invoice.roomId}`);

        await logRoomActivity({
            roomId: invoice.roomId,
            actorId: ctx.user.uid,
            type: RoomActivityType.INVOICE_PAID,
            payload: { invoiceId: invoice._id.toString(), name: invoice.name, amount },
        });

        return serializeDocument<IInvoice>(invoice);
    },
    input: (invoiceId, amount) => {
        z.string().min(1).parse(invoiceId);
        z.number().finite().positive("Số tiền thanh toán phải lớn hơn 0").parse(amount);
    },
    prechecks: [_authenticate],
});
