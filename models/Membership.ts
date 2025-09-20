import { IMembership } from "@/types/membership";
import mongoose, { Schema } from "mongoose";
import { UserData } from "@/models/UserData";
import { Room } from "@/models/Room";
import { MemberRole } from "@/enums/member-role";

export const membershipSchema = new Schema<IMembership>({
    user: { type: String, required: true, ref: UserData },
    room: { type: String, required: true, ref: Room },
    joinedAt: { type: Date, required: true },
    role: { type: String, enum: [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.MODERATOR], required: true }
})

export const Membership: mongoose.Model<IMembership> = mongoose.models.Membership || mongoose.model<IMembership>('Membership', membershipSchema);