import "server-only";
import mongoose from "mongoose";

let isConnecting = false;
export async function connectToDb() {
    if (isConnecting || mongoose.connections[0]?.readyState === 1) {
        console.log("Connecting or Already connected to Firestore DB");
        return;
    }

    try {
        isConnecting = true;

        if (!process.env.FIRESTORE_CONNECTION_URI) {
            throw new Error("FIRESTORE_CONNECTION_URI environment variable is not defined");
        }

        console.log("Connecting to Firestore DB...");

        mongoose.connection.removeAllListeners();
        await mongoose.connect(process.env.FIRESTORE_CONNECTION_URI);

        console.log("✅ Connected to Firestore DB successfully");

        // Event listeners
        mongoose.connection.on("error", (err) => {
            console.error("❌ Firestore DB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️ Firestore DB disconnected");
            isConnecting = false;
            // Auto-reconnect
            setTimeout(connectToDb, 5000);
        });

        mongoose.connection.on("reconnected", () => {
            console.log("✅ MongoDB reconnected");
        });
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        isConnecting = false;

        // Retry connection after delay
        setTimeout(connectToDb, 5000);
    } finally {
        isConnecting = false;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});
