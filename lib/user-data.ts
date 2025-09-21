import "server-only";
import { UserData } from "@/models/UserData";
import { DecodedIdToken } from "@/types/auth";

/**
 * Get user data, create one if not exists
 * @returns Document of UserData
 */
export async function getUserData(user: DecodedIdToken) {
    let userData = await UserData.findOne({ _id: user.user_id });
    if (!userData) {
        const newUserData = new UserData({
            _id: user.user_id,
            email: user.email,
            displayName: user.name,
            phoneNumber: user.phone_number,
            photoURL: user.picture
        });
        
        userData = await newUserData.save();
    }

    return userData;
}


export async function getUserDataById(userId: string) {
    let userData = await UserData.findOne({ _id: userId });

    return userData;
}