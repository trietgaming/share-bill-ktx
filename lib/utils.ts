import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { IInvoice } from "@/types/invoice";
import { InvoiceSplitMethod } from "@/enums/invoice";
import { IMonthPresence } from "@/types/month-presence";
import { PresenceStatus } from "@/enums/presence";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(
    amount: number,
    locale: string = "vi-VN",
    currency: string = "VND"
) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
    }).format(amount);
}

export function formatDate(date: Date, dateFormat: string = "dd/MM/yyyy") {
    return format(new Date(date), dateFormat, { locale: vi });
}

export function isYYYYMM(dateStr: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(dateStr);
}

export function toYYYYMM(date: Date): string;
export function toYYYYMM(year: number | string, month: number | string): string;

export function toYYYYMM(
    dateOrYear: Date | number | string,
    month?: number | string
): string {
    if (month) {
        return `${dateOrYear}-${month.toString().padStart(2, "0")}`;
    }
    return `${(dateOrYear as Date).getFullYear()}-${(
        (dateOrYear as Date).getMonth() + 1
    )
        .toString()
        .padStart(2, "0")}`;
}

export function parseYYYYMM(
    dateStr: string
): { year: number; month: number } | null {
    if (!isYYYYMM(dateStr)) {
        return null;
    }

    const parts = dateStr.split("-");

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return null;
    }

    return { year, month };
}

export function count<T>(arr: T[], predicate: (item: T) => boolean): number {
    let result = 0;
    for (let i = 0; i < arr.length; ++i) {
        if (predicate(arr[i])) {
            ++result;
        }
    }
    return result;
}

export function sum(numbers: number[]): number {
    let total = 0;
    for (const num of numbers) {
        total += num;
    }
    return total;
}

export async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateShare(
    invoice: IInvoice,
    userId: string,
    monthPresences: IMonthPresence[]
): [shareAmount: number, isPayable: boolean] {
    switch (invoice.splitMethod) {
        case InvoiceSplitMethod.BY_EQUALLY:
            return [invoice.amount / invoice.applyTo.length, true];

        case InvoiceSplitMethod.BY_PRESENCE:
            if (!invoice.monthApplied) {
                throw new Error(
                    "Month applied is required for presence-based split"
                );
            }

            if (monthPresences.length === 0) {
                return [invoice.amount / invoice.applyTo.length, false];
            }

            let isPayable = true;
            let totalPresentDays = 0;

            if (monthPresences.length < invoice.applyTo.length) {
                isPayable = false;
                totalPresentDays =
                    monthPresences[0].presence.length *
                    (invoice.applyTo.length - monthPresences.length);
            }

            let userPresentDays = 0;

            for (let i = 0; i < monthPresences.length; ++i) {
                const att = monthPresences[i];
                const presentDays = count(att.presence, (availability) => {
                    if (availability === PresenceStatus.UNDETERMINED) {
                        isPayable = false;
                    }
                    return availability === PresenceStatus.PRESENT;
                });

                totalPresentDays += presentDays;

                if (att.userId === userId) {
                    userPresentDays = presentDays;
                }
            }

            return [
                userPresentDays * (invoice.amount / totalPresentDays),
                isPayable,
            ];

        case InvoiceSplitMethod.BY_FIXED_AMOUNT:
            const share =
                "get" in invoice.splitMap
                    ? /// @ts-ignore (server-side Map type)
                      invoice.splitMap.get(userId)
                    : invoice.splitMap[userId];
            if (share == undefined) {
                throw new Error("Không tìm thấy thông tin chia tiền cho bạn.");
            }
            return [share, true];

        case InvoiceSplitMethod.BY_PERCENTAGE:
            const percentage =
                "get" in invoice.splitMap
                    ? /// @ts-ignore (server-side Map type)
                      invoice.splitMap.get(userId)
                    : invoice.splitMap[userId];
            if (percentage == undefined) {
                throw new Error("Không tìm thấy thông tin chia tiền cho bạn.");
            }
            return [(percentage / 100) * invoice.amount, true];
    }
}
