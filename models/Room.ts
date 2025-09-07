import "server-only";
import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import type { IRoom } from "@/types/Room";

const MAX_ROOM_ID_LENGTH = 8;

export const roomSchema = new Schema<IRoom>({
    _id: {
        type: String,
        unique: true,
        default: () => nanoid(MAX_ROOM_ID_LENGTH),
        required: true,
    },

    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        maxlength: [100, 'Room name cannot exceed 100 characters'],
    },

    maxMembers: {
        type: Number,
        required: [true, 'Max members is required'],
        min: [1, 'Room must allow at least 1 member'],
        max: [100, 'Room cannot exceed 100 members'],
    },

    members: {
        type: [{
            userData: {
                type: String,
                ref: 'UserData',
                required: true
            },
            joinedAt: {
                type: Date,
                default: Date.now
            },
            role: {
                type: String,
                enum: ['admin', 'member'],
                default: 'member'
            }
        }],
        validate: {
            validator: function (value: any[]) {
                return value.length <= (this as any).maxMembers
            },
            message: "Cannot exceed maximum member limit"
        }
    }
}, { timestamps: true, _id: false })

export const Room: mongoose.Model<IRoom> = mongoose.models.Room || mongoose.model("Room", roomSchema)
