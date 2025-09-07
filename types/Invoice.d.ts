export interface IPayInfo {
    paidBy: string;
    paidAt: Date;
    amount: number;
}

export interface IIinvoice {
    _id: string;
    roomId: string;
    amount: number;
    /**
     * walec - water and electricity bill
     */
    type: 'walec' | 'other';
    name: string;
    description: string;
    createdBy: string;
    createdAt: Date;
    dueDate: Date;
    payInfo: IPayInfo[];
    advancePayer?: IPayInfo;
    status: 'pending' | 'paid' | 'overdue';
    overdueAt?: Date;
    applyTo: string[] | 'all'; // user IDs
}