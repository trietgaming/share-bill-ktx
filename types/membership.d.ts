import { MemberRole } from "@/enums/member-role";
import { IRoom, IRoomDocument } from "@/types/room";
import { Document, ObjectId } from "mongoose";

export interface IMembership {
    _id: ObjectId;
    user: string;
    room: string;
    joinedAt: Date;
    role: MemberRole;
}

export interface MembershipDocument extends IMembership, Document {}

export interface IClientMembership {
    joinedAt: Date;
    role: MemberRole;
}
