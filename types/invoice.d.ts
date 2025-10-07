import { InvoiceSplitMethod } from "@/enums/invoice";
import { IBankAccount } from "./bank-account";

export interface IPayInfo {
    paidBy: string;
    paidAt: Date;
    amount: number;
}

export interface IInvoice {
    _id: string;
    roomId: string;
    amount: number;
    /**
     * Virtual
     */
    remainingAmount: number;
    /**
     * walec - water and electricity bill
     */
    type: "walec" | "roomCost" | "other";
    /**
     * For walec and roomCost type invoice, format: YYYY-MM
     */
    monthApplied?: string;
    name: string;
    description: string;
    createdBy: string;
    dueDate?: Date;
    payInfo: IPayInfo[];
    /**
     * Maybe user ID, or bank account info in stringified JSON format, or QR code URL
     */
    payTo?: string;
    splitMethod: InvoiceSplitMethod;
    /**
     * if splitMethod is by_fixed_amount, the value is the fixed amount
     *
     * if splitMethod is by_percentage, the value is the percentage (0-100)
     *
     * This value is ignored for other split methods
     */
    splitMap: {
        [userId: string]: number;
    };
    advancePayer?: IPayInfo;
    status: "pending" | "paid" | "overdue";
    /**
     * list of user IDs
     */
    applyTo: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PersonalInvoice extends IInvoice {
    personalAmount: number;
    isPaidByMe: boolean;
    myPayInfo?: IPayInfo;
    isPayable: boolean;
}
