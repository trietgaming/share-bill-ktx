import "server-only";
import mongoose from "mongoose";

export async function connectToDb() {
    console.log("Connecting to firestore database...")

    await mongoose.connect(process.env.FIRESTORE_CONNECTION_URI)

    console.log("Connected to firestore database.")
}