export interface IMonthPresence {
    month: string; // Format: YYYY-MM
    /**
     * Index 0 - Day 1, ..., Index 30 - Day 31
     */
    presence: ("present" | "absent" | "undetermined")[];
    roomId: string;
    userId: string;
}