import mongoose from "mongoose";

// ============================================================
// MongoDB Connection Singleton
// Prevents hot-reload connection storms in development
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not found in environment variables. Database operations will fail.");
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Extend globalThis for caching across hot reloads
declare global {
    // eslint-disable-next-line no-var
    var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose || { conn: null, promise: null };

if (!global._mongoose) {
    global._mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts: mongoose.ConnectOptions = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then((mongooseInstance) => {
                console.log("✅ MongoDB connected successfully");
                return mongooseInstance;
            })
            .catch((error) => {
                cached.promise = null;
                console.error("❌ MongoDB connection failed:", error.message);
                throw error;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

// Check connection status (for health checks)
export function getConnectionStatus(): string {
    const state = mongoose.connection.readyState;
    switch (state) {
        case 0: return "disconnected";
        case 1: return "connected";
        case 2: return "connecting";
        case 3: return "disconnecting";
        default: return "unknown";
    }
}

export default connectDB;
