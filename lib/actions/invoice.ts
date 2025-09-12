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

    const invoice = await Invoice.create({
        ...data,
        status: 'pending',
        createdBy: user.uid,
    })

    return serializeDocument<IInvoice>(invoice);
}

export async function getInvoicesByRoom(roomId: string): Promise<IInvoice[]> {
    const user = await authenticate();
    await verifyMembership(user.uid, roomId);

    const invoices = await Invoice.find({ roomId: roomId });

    return invoices.map(serializeDocument<IInvoice>);
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