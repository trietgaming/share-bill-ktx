"use server";

import { IInvoice, IPayInfo } from "@/types/invoice";
import { authenticate } from "@/lib/prechecks/auth";
import { calculateShare, Invoice } from "@/models/Invoice";
import { serializeDocument } from "@/lib/serializer";
import { verifyMembership, verifyRoomPermission } from "@/lib/prechecks/room";
import { AppError } from "../errors";
import { sendDeleteInvoiceNotification, sendNewInvoiceNotification } from "@/lib/messages/room";
import { createErrorResponse, createSuccessResponse } from "../actions-helper";
import { ErrorCode } from "@/enums/error";
import { ServerActionResponse } from "@/types/actions";

export interface CreateInvoiceFormData {
    roomId: string;
    amount: number;
    type: IInvoice['type'];
    monthApplied?: string;
    name: string;
    description: string;
    dueDate?: Date;
    applyTo: string[];
    advancePayer?: IPayInfo;
    payTo?: string;
}

export async function createNewInvoice(data: CreateInvoiceFormData): ServerActionResponse<IInvoice> {
    const user = await authenticate();
    await verifyMembership(user.uid, data.roomId);

    const invoice = await new Invoice({
        ...data,
        status: 'pending',
        createdBy: user.uid,
    }).save();

    sendNewInvoiceNotification(invoice);

    return createSuccessResponse(serializeDocument<IInvoice>(invoice));
}

export interface UpdateInvoiceFormData extends Partial<CreateInvoiceFormData> {
    invoiceId: string;
}

export async function updateInvoice(data: UpdateInvoiceFormData): ServerActionResponse<IInvoice> {
    const user = await authenticate();
    const invoice = await Invoice.findById(data.invoiceId);
    if (!invoice) {
        return createErrorResponse("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
    }

    await verifyMembership(user.uid, invoice!.roomId);

    Object.assign(invoice, data);
    await invoice.save();

    return createSuccessResponse(serializeDocument<IInvoice>(invoice));
}

interface GetRoomInvoicesQuery {
    status?: IInvoice['status'];
}
export async function getInvoicesByRoom(
    roomId: string,
    query: GetRoomInvoicesQuery = { status: 'pending' }
): ServerActionResponse<IInvoice[]> {
    const user = await authenticate();
    await verifyMembership(user.uid, roomId);

    const invoices = await Invoice.find({ roomId: roomId, status: query.status }).sort({ monthApplied: -1 });

    return createSuccessResponse(serializeDocument<IInvoice[]>(invoices));
}

export async function deleteInvoice(invoiceId: string): ServerActionResponse<null> {
    const user = await authenticate();
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        return createErrorResponse("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
    }

    const membership = await verifyMembership(user.uid, invoice.roomId);
    if (invoice.createdBy !== user.uid) {
        verifyRoomPermission(membership, ['admin', "moderator"]);
    }

    await Invoice.findByIdAndDelete(invoiceId);
    sendDeleteInvoiceNotification(invoice, user.uid);
    return createSuccessResponse(null);
}

export async function payInvoice(invoiceId: string, amount: number): ServerActionResponse<IInvoice> {
    const user = await authenticate();
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        return createErrorResponse("Không tìm thấy hóa đơn", ErrorCode.NOT_FOUND);
    }

    await verifyMembership(user.uid, invoice.roomId);
    const totalAmountToPay = await calculateShare(invoice, user.uid);
    const userPayInfo = invoice.payInfo?.find(pi => pi.paidBy === user.uid);

    if (userPayInfo) {
        if (userPayInfo.amount >= totalAmountToPay) {
            return createErrorResponse("Bạn đã thanh toán hóa đơn này rồi", ErrorCode.FORBIDDEN);
        }

        userPayInfo.amount = Math.min(userPayInfo.amount + amount, Math.round(totalAmountToPay));
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
}