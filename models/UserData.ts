import "server-only";
import mongoose, { Schema } from "mongoose";
import type { IUserData } from "@/types/UserData";

export const userDataSchema = new Schema<IUserData>({
    _id: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    bankAccounts: [{
        accountNumber: {
            type: String,
            required: true,
            trim: true
        },
        accountName: {
            type: String,
            required: true,
            trim: true
        },
        bankName: {
            type: String,
            required: true,
            trim: true
        },
    }],

    roomsJoined: [{
        room: {
            type: String,
            ref: 'Room',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        role: {
            type: String,
            enum: ['admin', 'member', 'moderator'],
            default: 'member'
        }
    }]
}, {
    timestamps: true,
    _id: false
})

export const UserData: mongoose.Model<IUserData> = mongoose.models.UserData || mongoose.model("UserData", userDataSchema);