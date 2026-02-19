import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/db";

// ============================================================
// GET /api/health — Health Check
// ============================================================

export async function GET() {
    let dbStatus = "not_initialized";

    try {
        // Attempt a quick status check without forcing a connection
        dbStatus = getConnectionStatus();
    } catch {
        dbStatus = "error";
    }

    const response = {
        status: "ok",
        db: dbStatus,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        uptime: process.uptime(),
    };

    return NextResponse.json(response, {
        status: 200,
        headers: {
            "Cache-Control": "no-cache, no-store",
        },
    });
}
