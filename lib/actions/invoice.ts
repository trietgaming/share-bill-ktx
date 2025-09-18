"use server";

import { IInvoice, IPayInfo } from "@/types/invoice";
import { authenticate } from "@/lib/prechecks/auth";
import { calculateShare, Invoice } from "@/models/Invoice";
import { serializeDocument } from "@/lib/serializer";
import { verifyMembership, verifyRoomPermission } from "@/lib/prechecks/room";
import { AppError } from "../errors";

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

export async function createNewInvoice(data: CreateInvoiceFormData) {
    const user = await authenticate();
    await verifyMembership(user.uid, data.roomId);

    const invoice = await new Invoice({
        ...data,
        status: 'pending',
        createdBy: user.uid,
    }).save();

    return serializeDocument<IInvoice>(invoice);
}

export interface UpdateInvoiceFormData extends Partial<CreateInvoiceFormData> {
    invoiceId: string;
}

export async function updateInvoice(data: UpdateInvoiceFormData) {
    const user = await authenticate();
    const invoice = await Invoice.findById(data.invoiceId);
    if (!invoice) {
        throw new AppError("Không tìm thấy hóa đơn");
    }

    await verifyMembership(user.uid, invoice!.roomId);

    Object.assign(invoice, data);
    await invoice.save();

    return serializeDocument<IInvoice>(invoice);
}

interface GetRoomInvoicesQuery {
    status?: IInvoice['status'];
}
export async function getInvoicesByRoom(
    roomId: string,
    query: GetRoomInvoicesQuery = { status: 'pending' }
): Promise<IInvoice[]> {
    const user = await authenticate();
    await verifyMembership(user.uid, roomId);

    const invoices = await Invoice.find({ roomId: roomId, status: query.status }).sort({ monthApplied: -1 });

    return serializeDocument<IInvoice[]>(invoices);
}

export async function deleteInvoice(invoiceId: string) {
    const user = await authenticate();
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw new AppError("Không tìm thấy hóa đơn");
    }

    const membership = await verifyMembership(user.uid, invoice.roomId);
    if (invoice.createdBy !== user.uid) {
        verifyRoomPermission(membership, ['admin', "moderator"]);
    }

    await Invoice.findByIdAndDelete(invoiceId);
}

export async function payInvoice(invoiceId: string, amount: number) {
    const user = await authenticate();
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw new AppError("Không tìm thấy hóa đơn");
    }

    await verifyMembership(user.uid, invoice.roomId);
    const totalAmountToPay = await calculateShare(invoice, user.uid);
    const userPayInfo = invoice.payInfo?.find(pi => pi.paidBy === user.uid);

    if (userPayInfo) {
        if (userPayInfo.amount >= totalAmountToPay) {
            throw new AppError("Bạn đã thanh toán hóa đơn này rồi");
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

    return serializeDocument<IInvoice>(invoice);
}