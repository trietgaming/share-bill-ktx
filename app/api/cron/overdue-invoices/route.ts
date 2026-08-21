import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isValidCronSecret } from "@/lib/cron-auth";
import { ensureDbConnection } from "@/lib/db-connect";
import { Invoice } from "@/models/Invoice";

/**
 * Bulk-flips invoices to "overdue" once their dueDate has passed. The
 * Invoice model only recomputes `status` in a pre-save hook, so an invoice
 * sitting untouched past its due date stays "pending" forever unless
 * something else calls .save() on it - this cron is that something else.
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!isValidCronSecret(authHeader, process.env.CRON_SECRET)) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    await ensureDbConnection();

    const now = new Date();
    const overdueFilter = {
        status: "pending",
        dueDate: { $lte: now },
    };

    const affectedInvoices = await Invoice.find(overdueFilter)
        .select({ roomId: 1 })
        .lean();

    if (affectedInvoices.length === 0) {
        return NextResponse.json({ success: true, updated: 0 });
    }

    await Invoice.updateMany(overdueFilter, { $set: { status: "overdue" } });

    const roomIds = new Set(affectedInvoices.map((inv) => inv.roomId));
    for (const roomId of roomIds) {
        revalidateTag(`invoices-${roomId}`);
        revalidateTag(`invoices-pending-${roomId}`);
        revalidateTag(`invoices-overdue-${roomId}`);
    }

    return NextResponse.json({
        success: true,
        updated: affectedInvoices.length,
    });
}
