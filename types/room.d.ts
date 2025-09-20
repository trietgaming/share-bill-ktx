import { Document } from "mongoose";

export interface IRoom {
    _id: string;
    name: string;
    members: string[];
    maxMembers: number;
    inviteToken: string;
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRoomDocument extends IRoom, Document {}