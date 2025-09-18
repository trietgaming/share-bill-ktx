import { IBankAccount } from "@/types/bank-account";
import mongoose from "mongoose";

function requiredIfNoQRCode(this: IBankAccount, v: string) {
    if (!this.qrCodeUrl) {
        return !!v
    }
    return true;
}

export const bankAccountSchema = new mongoose.Schema<IBankAccount>({
    accountNumber: {
        type: String,
        trim: true,
        maxLength: [30, 'Account number can not be more than 30 characters'],
        validate: {
            validator: requiredIfNoQRCode,
            message: 'Account number is required if QR code URL is not provided'
        }
    },
    accountName: {
        type: String,
        trim: true,
        maxLength: [100, 'Account name can not be more than 100 characters'],
        validate: {
            validator: requiredIfNoQRCode,
            message: 'Account name is required if QR code URL is not provided'
        }
    },
    bankName: {
        type: String,
        trim: true,
        maxLength: [100, 'Bank name can not be more than 100 characters'],
        required: [true, 'Bank name is required']
    },
    qrCodeUrl: {
        type: String,
        trim: true,

        validate: {
            validator: function (this: IBankAccount, v: string) {
                if (!this.accountNumber && !this.accountName && !this.bankName) {
                    return !!v;
                }
                return true;
            },
            message: 'QR code URL is required if all accountNumber, accountName and bankName are not provided'
        }
    }
})

export const BankAccount: mongoose.Model<IBankAccount> = mongoose.models.BankAccount || mongoose.model("BankAccount", bankAccountSchema);
