"use server";

import { IInvoice, IPayInfo } from "@/types/invoice";
import { authenticate } from "@/lib/prechecks/auth";
import { calculateShare, Invoice } from "@/models/Invoice";
import { serializeDocument } from "@/lib/serializer";
import { verifyMembership, verifyRoomPermission } from "@/lib/prechecks/room";
import {
    sendDeleteInvoiceNotification,
    sendNewInvoiceNotification,
    sendUpdateInvoiceNotification,
} from "@/lib/messages/invoice";
import {
    createErrorResponse,
    createSuccessResponse,
    handleServerActionError,
} from "../actions-helper";
import { ErrorCode } from "@/enums/error";
import { ServerActionResponse } from "@/types/actions";
import { MemberRole } from "@/enums/member-role";
import { AppValidationError } from "../errors";

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

export async function createNewInvoice(
    data: CreateInvoiceFormData
): ServerActionResponse<IInvoice> {
    const user = await authenticate();
    const [_, err] = await verifyMembership(user.uid, data.roomId);

    if (err) return createErrorResponse(err);

    try {
        const invoice = await new Invoice({
            ...data,
            status: "pending",
            createdBy: user.uid,
        }).save();

        sendNewInvoiceNotification(invoice);

        return createSuccessResponse(serializeDocument<IInvoice>(invoice));
    } catch (error) {
        return handleServerActionError(error);
    }
}

export interface UpdateInvoiceFormData extends Partial<CreateInvoiceFormData> {
    invoiceId: string;
}

export async function updateInvoice(
    data: UpdateInvoiceFormData
): ServerActionResponse<IInvoice> {
    const user = await authenticate();
    const invoice = await Invoice.findById(data.invoiceId);
    if (!invoice) {
        return createErrorResponse(
            "Không tìm thấy hóa đơn",
            ErrorCode.NOT_FOUND
        );
    }
    const [_, err] = await verifyMembership(user.uid, invoice!.roomId);
    if (err) return createErrorResponse(err);

    try {
        Object.assign(invoice, data);
        await invoice.save();

        sendUpdateInvoiceNotification(invoice, user.uid);
        return createSuccessResponse(serializeDocument<IInvoice>(invoice));
    } catch (error) {
        return handleServerActionError(error);
    }
}

interface GetRoomInvoicesQuery {
    status?: IInvoice["status"];
}
export async function getInvoicesByRoom(
    roomId: string,
    query: GetRoomInvoicesQuery = { status: "pending" }
): ServerActionResponse<IInvoice[]> {
    const user = await authenticate();

    const [_, err] = await verifyMembership(user.uid, roomId);
    if (err) return createErrorResponse(err);

    const invoices = await Invoice.find({
        roomId: roomId,
        status: query.status,
    }).sort({ monthApplied: -1 });

    return createSuccessResponse(serializeDocument<IInvoice[]>(invoices));
}

export async function deleteInvoice(
    invoiceId: string
): ServerActionResponse<null> {
    const user = await authenticate();
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        return createErrorResponse(
            "Không tìm thấy hóa đơn",
            ErrorCode.NOT_FOUND
        );
    }

    const [membership, membershipError] = await verifyMembership(
        user.uid,
        invoice.roomId
    );
    if (membershipError) return createErrorResponse(membershipError);

    if (invoice.createdBy !== user.uid) {
        const [_, err] = verifyRoomPermission(membership, [
            MemberRole.ADMIN,
            MemberRole.MODERATOR,
        ]);
        if (err) return createErrorResponse(err);
    }

    try {
        await Invoice.findByIdAndDelete(invoiceId);
        sendDeleteInvoiceNotification(invoice, user.uid);
        return createSuccessResponse(null);
    } catch (error) {
        return handleServerActionError(error);
    }
}

export async function payInvoice(
    invoiceId: string,
    amount: number
): ServerActionResponse<IInvoice> {
    const user = await authenticate();
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        return createErrorResponse(
            "Không tìm thấy hóa đơn",
            ErrorCode.NOT_FOUND
        );
    }

    const [_, err] = await verifyMembership(user.uid, invoice.roomId);
    if (err) return createErrorResponse(err);

    try {
        const totalAmountToPay = await calculateShare(invoice, user.uid);
        const userPayInfo = invoice.payInfo?.find(
            (pi) => pi.paidBy === user.uid
        );

        if (userPayInfo) {
            if (userPayInfo.amount >= totalAmountToPay) {
                return createErrorResponse(
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
                paidBy: user.uid,
                amount: Math.min(amount, Math.round(totalAmountToPay)),
                paidAt: new Date(),
            });
        }

        await invoice.save();

        return createSuccessResponse(serializeDocument<IInvoice>(invoice));
    } catch (error) {
        return handleServerActionError(error);
    }
}
