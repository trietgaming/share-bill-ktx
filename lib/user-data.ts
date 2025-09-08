import "server-only";
import { UserData } from "@/models/UserData";
import { User } from "firebase/auth";

/**
 * Get user data, create one if not exists
 * @returns Document of UserData
 */
export async function getUserData(user: User) {
    let userData = await UserData.findOne({ _id: user.uid });
    if (!userData) {
        const newUserData = new UserData({
            _id: user.uid,
            email: user.email,
            displayName: user.displayName,
            phoneNumber: user.phoneNumber,
            photoURL: user.photoURL
        });
        
        userData = await newUserData.save();
    }

    return userData;
}


export async function getUserDataById(userId: string) {
    let userData = await UserData.findOne({ _id: userId });

    return userData;
}