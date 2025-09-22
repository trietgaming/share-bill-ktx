import "server-only";
import mongoose from "mongoose";

if (!process.env.FIRESTORE_CONNECTION_URI) {
    throw new Error(
        "FIRESTORE_CONNECTION_URI environment variable is not defined"
    );
}

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDb() {
    if (cached.conn) {
        console.log("Connecting or Already connected to Firestore DB");
        return;
    }

    try {
        console.log("Connecting to Firestore DB...");

        mongoose.connection.removeAllListeners();
        cached.promise = mongoose.connect(process.env.FIRESTORE_CONNECTION_URI);

        cached.conn = await cached.promise;

        console.log("✅ Connected to Firestore DB successfully");

        // Event listeners
        mongoose.connection.on("error", (err) => {
            console.error("❌ Firestore DB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️ Firestore DB disconnected");
            cached.conn = null;
            // Auto-reconnect
            setTimeout(connectToDb, 5000);
        });

        mongoose.connection.on("reconnected", () => {
            console.log("✅ MongoDB reconnected");
        });
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        cached.conn = null;

        // Retry connection after delay
        setTimeout(connectToDb, 5000);
    } finally {
        cached.conn = null;
    }
}
