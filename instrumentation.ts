import "server-only";
import { connectToDb } from "@/lib/db-connect";

export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    console.log("Running instrumentation for DB connection...");

    await connectToDb();
}
