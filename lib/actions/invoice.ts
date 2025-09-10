"use server";

import { IInvoice, IPayInfo } from "@/types/Invoice";
import { authenticate } from "@/lib/prechecks/auth";
import { Invoice } from "@/models/Invoice";
import { serializeDocument } from "@/lib/serializer";
import { verifyMembership } from "@/lib/prechecks/room";

export interface CreateInvoiceFormData {
    roomId: string;
    amount: number;
    type: IInvoice['type'];
    name: string;
    description: string;
    dueDate?: Date;
    applyTo: string[];
    advancePayer?: IPayInfo;
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