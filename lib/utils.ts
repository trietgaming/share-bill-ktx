import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale: string = 'vi-VN', currency: string = 'VND') {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatDate(date: Date, dateFormat: string = 'dd/MM/yyyy') {
    return format(new Date(date), dateFormat, { locale: vi });
}

export function isYYYYMM(dateStr: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(dateStr);
}

export function toYYYYMM(date: Date): string;
export function toYYYYMM(year: number | string, month: number | string): string;

export function toYYYYMM(dateOrYear: Date | number | string, month?: number | string): string {
    if (month) {
        return `${dateOrYear}-${month.toString().padStart(2, '0')}`;
    }
    return `${(dateOrYear as Date).getFullYear()}-${((dateOrYear as Date).getMonth() + 1).toString().padStart(2, '0')}`;
}

export function parseYYYYMM(dateStr: string): { year: number, month: number } | null {
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