import "server-only";


export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    
    const { connectToDb } = await import("@/lib/db-connect")

    await connectToDb();
}