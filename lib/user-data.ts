import "server-only";
import { UserData } from "@/models/UserData";
import { IUserData } from "@/types/UserData";
import { Room } from "@/models/Room";

/**
 * Find user data by user id, create one if not exists
 */
export async function getUserDataById(userId: string): Promise<IUserData> {
    let userData = await UserData.findOne({ _id: userId }).populate({ path: "roomsJoined.room", model: Room });
    if (!userData) {
        const newUserData = await new UserData({ _id: userId }).populate({ path: "roomsJoined.room", model: Room });
        userData = await newUserData.save();
    }

    return userData.toJSON({ "flattenObjectIds": true })
}