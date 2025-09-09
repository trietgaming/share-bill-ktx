import { IRoom, IRoomDocument } from "@/types/Room";
import { Document, ObjectId } from "mongoose";

export interface IMembership {
    _id: ObjectId;
    user: string;
    room: string;
    joinedAt: Date;
    role: 'admin' | 'member' | 'moderator';
}

export interface IClientMembership {
    joinedAt: Date;
    role: 'admin' | 'member' | 'moderator';
}