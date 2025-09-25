import { PresenceStatus } from "@/enums/presence";
import { IMonthPresence } from "@/types/month-presence";
import mongoose from "mongoose";

const monthPresenceSchema = new mongoose.Schema<IMonthPresence>({
    month: {
        type: String,
        required: true,
        validate: {
            validator: (v: string) =>
                /^\d{4}-\d{2}$/.test(v) &&
                v >= "2024-01" &&
                v <= `${new Date().getFullYear() + 1}-12`,
            message: `Month must be in format YYYY-MM and not too far from present`,
        },
    }, // Format: YYYY-MM
    presence: {
        type: [
            {
                type: Number,
                enum: [
                    PresenceStatus.PRESENT,
                    PresenceStatus.ABSENT,
                    PresenceStatus.UNDETERMINED,
                ],
                default: PresenceStatus.UNDETERMINED,
            },
        ],
        required: true,
        validate: {
            validator: function (this: IMonthPresence, arr: string[]) {
                if (!this.month) return false;
                const [year, month] = this.month.split("-").map(Number);

                const daysInMonth = new Date(year, month, 0).getDate();

                return arr.length == daysInMonth;
            },
            message: `Presence array must have valid entries for each day of the month`,
        },
    }, // Index 0 - Day 1, ..., Index 30 - Day 31
    roomId: { type: String, ref: "Room", required: true },
    userId: { type: String, ref: "UserData", required: true },
});
monthPresenceSchema.index({ month: 1, roomId: 1, userId: 1 }, { unique: true });
monthPresenceSchema.index({ roomId: 1, userId: 1 }, { unique: false });

export const MonthPresence: mongoose.Model<IMonthPresence> =
    mongoose.models.MonthPresence ||
    mongoose.model("MonthPresence", monthPresenceSchema);
