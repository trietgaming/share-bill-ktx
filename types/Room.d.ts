export interface IRoomMember {
    userData: string;
    role: 'admin' | 'member';
    joinedAt: Date;
}

export interface IRoom {
    _id: string;
    name: string;
    members: IRoomMember[];
    maxMembers: number;
}