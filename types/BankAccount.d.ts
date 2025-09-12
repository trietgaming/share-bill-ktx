import mongoose from "mongoose";

export interface IBankAccount {
    _id: mongoose.Types.ObjectId;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    qrCodeUrl?: string;
}

export interface IClientBankAccount extends Omit<IBankAccount, "_id"> {
    _id: string;
}
