import { IRoom } from "@/types/Room";
import mongoose from "mongoose";
import { IClientBankAccount } from "./BankAccount";

export interface IUserData {
    _id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    phoneNumber?: string;
    /**
     * Main bank account is the first account in the list
     */
    bankAccounts: mongoose.Types.ObjectId[];
    roomsJoined: string[];
}

export interface IUserDataWithBankAccounts extends Omit<IUserData, "bankAccounts"> {
    bankAccounts: IClientBankAccount[];
}