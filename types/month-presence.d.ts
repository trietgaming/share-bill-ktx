import { PresenceStatus } from "@/enums/presence";

export interface IMonthPresence {
    month: string; // Format: YYYY-MM
    /**
     * Index 0 - Day 1, ..., Index 30 - Day 31
     */
    presence: PresenceStatus[];
    roomId: string;
    userId: string;
}