import { IMonthAttendance } from "@/types/MonthAttendance";
import mongoose from "mongoose";

const monthAttendanceSchema = new mongoose.Schema<IMonthAttendance>({
    month: {
        type: String,
        required: true,
        validate: {
            validator: (v: string) => /^\d{4}-\d{2}$/.test(v) && v >= '2024-01' && v <= `${new Date().getFullYear() + 1}-12`, message: `Month must be in format YYYY-MM and not too far from present`
        }
    }, // Format: YYYY-MM
    attendance: {
        type: [{ type: String, enum: ["present", "absent", "undetermined"], default: "undetermined" }],
        required: true,
        validate: {
            validator: function (this: IMonthAttendance, arr: string[]) {
                if (!this.month) return false;
                const [year, month] = this.month.split("-").map(Number);

                const daysInMonth = new Date(year, month, 0).getDate();

                return arr.length == daysInMonth;
            },
            message: `Attendance array must have valid entries for each day of the month`
        }
    }, // Index 0 - Day 1, ..., Index 30 - Day 31
    roomId: { type: String, ref: 'Room', required: true },
    userId: { type: String, ref: 'UserData', required: true },
});
monthAttendanceSchema.index({ month: 1, room: 1, user: 1 }, { unique: true });

export const MonthAttendance: mongoose.Model<IMonthAttendance> = mongoose.models.MonthAttendance || mongoose.model('MonthAttendance', monthAttendanceSchema);