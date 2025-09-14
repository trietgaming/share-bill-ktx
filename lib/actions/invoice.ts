"use server";

import { IInvoice, IPayInfo } from "@/types/Invoice";
import { authenticate } from "@/lib/prechecks/auth";
import { Invoice } from "@/models/Invoice";
import { serializeDocument } from "@/lib/serializer";
import { verifyMembership, verifyRoomPermission } from "@/lib/prechecks/room";

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
        throw new Error("Invoice not found");
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
        throw new Error("Invoice not found");
    }

    const membership = await verifyMembership(user.uid, invoice.roomId);
    verifyRoomPermission(membership, ['admin', "moderator"]);

    await Invoice.findByIdAndDelete(invoiceId);
}

export async function payInvoice(invoiceId: string) {
    

}