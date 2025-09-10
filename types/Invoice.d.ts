export interface IPayInfo {
    paidBy: string;
    paidAt: Date;
    amount: number;
}

export interface IInvoice {
    _id: string;
    roomId: string;
    amount: number;
    /**
     * Virtual
     */
    remainingAmount: number;
    /**
     * walec - water and electricity bill
     */
    type: 'walec' | 'roomCost' | 'other';
    name: string;
    description: string;
    createdBy: string;
    dueDate?: Date;
    payInfo: IPayInfo[];
    advancePayer?: IPayInfo;
    status: 'pending' | 'paid' | 'overdue';
    /**
     * list of user IDs
     */
    applyTo: string[];
    createdAt: Date;
    updatedAt: Date;
}