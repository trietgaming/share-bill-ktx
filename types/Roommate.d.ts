import { IBankAccount } from "./BankAccount";

export interface Roommate {
    userId: string;
    displayName: string;
    email: string;
    photoUrl?: string;
    joinedAt: Date;
    role: 'admin' | 'member' | 'moderator';
    bankAccounts: IBankAccount[];
}