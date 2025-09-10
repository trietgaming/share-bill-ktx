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
    return format(date, dateFormat, { locale: vi });
}