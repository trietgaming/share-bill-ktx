import { IInvoice, IPayInfo } from "@/types/invoice";
import mongoose, { Schema } from "mongoose";
import { BankAccount, bankAccountSchema } from "@/models/BankAccount";
import { MonthPresence } from "./MonthPresence";
import { count, sum } from "@/lib/utils";
import { AppError } from "@/lib/errors";

export const payInfoSchema = new Schema<IPayInfo>({
    paidBy: {
        type: String,
        required: true,
        ref: 'UserData'
    },
    paidAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive number']
    },
});

export const invoiceSchema = new Schema<IInvoice>({

    advancePayer: {
        type: payInfoSchema
    },

    roomId: {
        type: String,
        required: true,
        index: true,
    },

    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive number']
    },

    type: {
        type: String,
        required: true,
        enum: ['walec', 'other', 'roomCost'],
        default: 'other'
    },

    monthApplied: {
        type: String,
        match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month applied must be in YYYY-MM format'],
        // required if type is walec or roomCost
        validate: {
            validator: function (this: IInvoice, v: string) {
                if (this.type === 'walec' || this.type === 'roomCost') {
                    return !!v;
                }
                return true;
            },
            message: 'Month applied is required for walec and roomCost type invoice'
        }
    },

    name: {
        type: String,
        required: true,
        default: "Điện nước",
        maxLength: [50, 'Name can not be more than 50 characters'],
    },

    description: {
        type: String,
        maxLength: [150, 'Description can not be more than 150 characters'],
    },

    createdBy: {
        type: String,
        required: true,
        ref: 'UserData'
    },

    status: {
        type: String,
        required: true,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    },

    dueDate: Date,

    payInfo: {
        type: [payInfoSchema]
    },

    payTo: {
        type: String,
        trim: true,
        // Could be user ID, or bank account info in stringified JSON format, or QR code URL
        maxLength: [1024, 'Pay to info can not be more than 1024 characters'],
        validate: {
            validator: function (v: string) {
                try {
                    const obj = JSON.parse(v);
                    const bankAccount = new BankAccount(obj);
                    const error = bankAccount.validateSync();
                    return !error;
                } catch (e) {
                    // Not a JSON, could be user ID or QR code URL
                    return true;
                }
            },
            message: 'Pay to info must be a valid bank account JSON, user ID or QR code URL'
        }
    },

    applyTo: {
        type: [String],
    }

}, {
    timestamps: true,
    methods: {
        calculateShare
    }
})

invoiceSchema.virtual('remainingAmount').get(function (this: IInvoice) {
    const paidAmount = this.payInfo?.reduce((sum, pay) => sum + pay.amount, 0) || 0;
    return this.amount - paidAmount;
});

invoiceSchema.pre('save', function (next) {
    const now = new Date();

    if (this.remainingAmount <= 0) {
        this.status = 'paid';
        return next();
    }

    // If has due date and past due date, overdue
    if (this.dueDate && now >= this.dueDate) {
        this.status = 'overdue';
        return next();
    }

    this.status = 'pending';

    next();
});

invoiceSchema.index({ roomId: 1, status: 1 })
invoiceSchema.index({ roomId: 1, applyTo: 1, monthApplied: 1 })
invoiceSchema.index({ roomId: 1, status: 1, monthApplied: 1 })
invoiceSchema.index({ roomId: 1, status: 1, dueDate: 1 })

export const Invoice: mongoose.Model<IInvoice> = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export async function calculateShare(invoice: IInvoice, userId: string) {
    if (invoice.type === "other") {
        return invoice.amount / invoice.applyTo.length;
    } else {
        const presences = await MonthPresence.find({ roomId: invoice.roomId, month: invoice.monthApplied });

        if (presences.length < invoice.applyTo.length) {
            throw new AppError("Chưa có đủ dữ liệu điểm danh cho tháng này, không thể tính toán được số tiền phải trả của bạn.")
        }

        let totalPresentDays = 0;
        let userPresentDays = 0;

        for (let i = 0; i < presences.length; ++i) {
            const att = presences[i];
            const presentDays = count(att.presence, availability => {
                if (availability === 'undetermined') {
                    throw new AppError("Các thành viên chưa hoàn thành điểm danh, không thể tính toán được số tiền phải trả của bạn.");
                }
                return availability === 'present';
            });

            totalPresentDays += presentDays;

            if (att.userId === userId) {
                userPresentDays = presentDays;
            }
        }

        return userPresentDays * (invoice.amount / totalPresentDays);
    }
}
