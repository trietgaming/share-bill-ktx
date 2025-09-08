"use server";

import { getAuthenticatedUser } from "@/lib/firebase/server";
import { getUserData } from "@/lib/user-data";
import { serializeDocument } from "../serializer";
import { IUserData } from "@/types/UserData";

export async function getAuthenticatedUserData() {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const userData = await getUserData(user);
    return serializeDocument<IUserData>(userData);
}