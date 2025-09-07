import { IRoom } from "@/types/Room";

export interface IRoomJoined {
    room: IRoom;
    joinedAt: Date;
    role: 'admin' | 'member';
}

export interface IBankAccount {
    accountNumber: string;
    accountName: string;
    bankName: string;
    qrCodeUrl?: string;
}

export interface IUserData {
    _id: string;
    /**
     * Main bank account is the first account in the list
     */
    bankAccounts: IBankAccount[];
    roomsJoined: IRoomJoined[];
}