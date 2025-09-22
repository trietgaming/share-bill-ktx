import "server-only";
import mongoose from "mongoose";

class GlobalRef<T> {
  private readonly sym: symbol;

  constructor(uniqueName: string) {
    this.sym = Symbol.for(uniqueName);
  }

  get value(): T | undefined {
    return (global as any)[this.sym];
  }

  set value(value: T) {
    (global as any)[this.sym] = value;
  }
}

const dbConn = new GlobalRef('db.connection');

if (!process.env.FIRESTORE_CONNECTION_URI) {
    throw new Error(
        "FIRESTORE_CONNECTION_URI environment variable is not defined"
    );
}

export async function connectToDb() {
    if (dbConn.value) {
        console.log("Connecting or Already connected to Firestore DB");
        return;
    }

    try {
        console.log("Connecting to Firestore DB...");

        mongoose.connection.removeAllListeners();
        dbConn.value = await mongoose.connect(process.env.FIRESTORE_CONNECTION_URI);

        console.log("✅ Connected to Firestore DB successfully");

        // Event listeners
        mongoose.connection.on("error", (err) => {
            console.error("❌ Firestore DB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️ Firestore DB disconnected");
            dbConn.value = null;
            // Auto-reconnect
            setTimeout(connectToDb, 5000);
        });

        mongoose.connection.on("reconnected", () => {
            console.log("✅ MongoDB reconnected");
        });
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        dbConn.value = null;

        // Retry connection after delay
        setTimeout(connectToDb, 5000);
    } finally {
        dbConn.value = null;
    }
}
