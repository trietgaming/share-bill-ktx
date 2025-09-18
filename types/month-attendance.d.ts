export interface IMonthAttendance {
    month: string; // Format: YYYY-MM
    /**
     * Index 0 - Day 1, ..., Index 30 - Day 31
     */
    attendance: ("present" | "absent" | "undetermined")[];
    roomId: string;
    userId: string;
}