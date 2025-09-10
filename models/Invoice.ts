import { IInvoice, IPayInfo } from "@/types/Invoice";
import mongoose, { Schema } from "mongoose";

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

    name: {
        type: String,
        required: true,
        default: "Tiền điện nước",
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

    applyTo: {
        type: [String],
    }

}, {
    timestamps: true
})

invoiceSchema.virtual('remainingAmount').get(function (this: IInvoice) {
    const paidAmount = this.payInfo?.reduce((sum, pay) => sum + pay.amount, 0) || 0;
    return this.amount - paidAmount;
});

// TODO: These should not run on every save

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
invoiceSchema.index({ roomId: 1, status: 1, dueDate: 1 })

export const Invoice: mongoose.Model<IInvoice> = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
