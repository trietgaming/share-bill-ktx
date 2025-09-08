import "server-only";
import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import type { IRoom } from "@/types/Room";
import { ROOM_ID_LENGTH, ROOM_MAX_MEMBERS_LIMIT } from "@/lib/app-constants";

export const roomSchema = new Schema<IRoom>({
    _id: {
        type: String,
        unique: true,
        default: () => nanoid(ROOM_ID_LENGTH),
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
        max: [ROOM_MAX_MEMBERS_LIMIT, 'Room cannot exceed 12 members'],
    },

    members: {
        type: [{
            type: String,
            ref: 'UserData'
        }],
        validate: {
            validator: function (this: IRoom, value: string[]) {
                return value.length <= this.maxMembers
            },
            message: "Cannot exceed maximum member limit"
        },
    }
}, { timestamps: true, _id: false })

export const Room: mongoose.Model<IRoom> = mongoose.models.Room || mongoose.model("Room", roomSchema)
