import { RoomActivityType } from "@/enums/room-activity";

export interface IRoomActivity {
    _id: string;
    roomId: string;
    actorId: string;
    type: RoomActivityType;
    payload?: Record<string, any>;
    createdAt: Date;
}
