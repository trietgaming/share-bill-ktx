import "server-only";
import mongoose, { Schema } from "mongoose";
import { RoomActivityType } from "@/enums/room-activity";
import type { IRoomActivity } from "@/types/room-activity";

const roomActivitySchema = new Schema<IRoomActivity>(
    {
        roomId: { type: String, required: true, ref: "Room", index: true },
        actorId: { type: String, required: true, ref: "UserData" },
        type: {
            type: String,
            required: true,
            enum: Object.values(RoomActivityType),
        },
        payload: { type: Schema.Types.Mixed },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

roomActivitySchema.index({ roomId: 1, _id: -1 });

export const RoomActivity: mongoose.Model<IRoomActivity> =
    mongoose.models.RoomActivity ||
    mongoose.model("RoomActivity", roomActivitySchema);
