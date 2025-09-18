import { Document } from "mongoose";

export interface IRoom {
    _id: string;
    name: string;
    members: string[];
    maxMembers: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRoomDocument extends IRoom, Document {}