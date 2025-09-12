import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { setAuthCookie, setAuthRefreshTokenCookie } from "@/lib/firebase/server";

export async function logIn() {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('https://www.googleapis.com/auth/drive.file')
    const result = await signInWithPopup(firebaseClientAuth, googleProvider);
    await setAuthRefreshTokenCookie(result.user.refreshToken);
}

export async function logOut() {
    await firebaseClientAuth.signOut();
    await setAuthRefreshTokenCookie(null)
}
