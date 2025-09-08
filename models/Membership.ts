import { IMembership } from "@/types/Membership";
import mongoose, { Schema } from "mongoose";
import { UserData } from "@/models/UserData";
import { Room } from "@/models/Room";

export const membershipSchema = new Schema<IMembership>({
    user: { type: String, required: true, ref: UserData },
    room: { type: String, required: true, ref: Room },
    joinedAt: { type: Date, required: true },
    role: { type: String, enum: ['admin', 'member', 'moderator'], required: true }
})

export const Membership: mongoose.Model<IMembership> = mongoose.models.Membership || mongoose.model<IMembership>('Membership', membershipSchema);