import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { ApiResponse } from "@/types/api";

// ============================================================
// GET /api/auth/ga-status — Check if an active GA exists
// ============================================================
export async function GET() {
    try {
        await connectDB();
        const activeGA = await User.findOne({ role: "ga", isActive: true }).lean();

        return NextResponse.json<ApiResponse<{ hasActiveGA: boolean }>>({
            success: true,
            data: { hasActiveGA: !!activeGA },
        });
    } catch (error) {
        console.error("GET /api/auth/ga-status error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
