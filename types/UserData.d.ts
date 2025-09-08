import { IRoom } from "@/types/Room";

export interface IBankAccount {
    accountNumber: string;
    accountName: string;
    bankName: string;
    qrCodeUrl?: string;
}

export interface IUserData {
    _id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    phoneNumber?: string;
    /**
     * Main bank account is the first account in the list
     */
    bankAccounts: IBankAccount[];
    roomsJoined: string[];
}