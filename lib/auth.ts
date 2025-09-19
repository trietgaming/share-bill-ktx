"use client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseClientAuth, firebaseMessaging } from "@/lib/firebase/client";
import { setAuthRefreshTokenCookie } from "@/lib/firebase/server";
import { deleteToken } from "firebase/messaging";

export async function logIn() {
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseClientAuth, googleProvider);
    await setAuthRefreshTokenCookie(result.user.refreshToken);
}

export async function logOut() {
    await firebaseClientAuth.signOut();
    await setAuthRefreshTokenCookie(null);
    await deleteToken(firebaseMessaging);
}
