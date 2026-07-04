"use client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseClientAuth, firebaseMessaging } from "@/lib/firebase/client";
import { setSessionRefreshTokenCookie } from "@/lib/firebase/auth-actions";
import { deleteToken } from "firebase/messaging";
import { queryClient } from "./query-client";

export async function logIn() {
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseClientAuth, googleProvider);
    await setSessionRefreshTokenCookie(result.user.refreshToken);
    queryClient.invalidateQueries();
}

export async function logOut() {
    await firebaseClientAuth.signOut();
    await setSessionRefreshTokenCookie(null);
    await deleteToken(firebaseMessaging);
    queryClient.removeQueries();
}
