import "server-only";
import mongoose from "mongoose";

declare global {
    var mongoose: any; // This must be a `var` and not a `let / const`
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

if (!process.env.FIRESTORE_CONNECTION_URI) {
    throw new Error(
        "FIRESTORE_CONNECTION_URI environment variable is not defined"
    );
}

export async function ensureDbConnection() {
    if (cached.conn) {
        return;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.FIRESTORE_CONNECTION_URI)
            .then((mongoose) => {
                return mongoose;
            });
    }

    // A connection attempt may already be in flight from a concurrent
    // request; awaiting it here (instead of returning early) is what
    // actually makes concurrent callers wait for a ready connection.
    try {
        cached.conn = await cached.promise;
        console.log("Connected to Firestore DB");
    } catch (e) {
        cached.promise = null;
        throw e;
    }
}
