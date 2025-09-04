import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseClientAuth } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/firebase/server";

export async function logIn() {
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(firebaseClientAuth, googleProvider);
    await setAuthCookie(await result.user.getIdToken());
}

export async function logOut() {
    await firebaseClientAuth.signOut();
    await setAuthCookie(null);
}
