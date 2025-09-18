import { IClientBankAccount } from "./bank-account";

export interface Roommate {
    userId: string;
    displayName: string;
    email: string;
    photoUrl?: string;
    joinedAt: Date;
    role: 'admin' | 'member' | 'moderator';
    bankAccounts: IClientBankAccount[];
}