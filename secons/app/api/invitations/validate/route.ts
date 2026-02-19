import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import InvitationToken from "@/models/InvitationToken";
import { authRateLimit } from "@/lib/rate-limiter";
import type { ApiResponse } from "@/types/api";

// ============================================================
// GET /api/invitations/validate — Validate an Access Code
// Public endpoint used by the login page to gate Google Auth
// ============================================================
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code")?.toUpperCase();

        if (!code || code.length !== 6) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invalid code format" },
                { status: 400 }
            );
        }

        // Rate limit
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const rateCheck = authRateLimit(ip);
        if (!rateCheck.allowed) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Too many attempts. Please try again later." },
                { status: 429 }
            );
        }

        await connectDB();

        const invite = await InvitationToken.findOne({
            token: code,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!invite) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invalid or expired access code" },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<{ role: string; domain: string }>>({
            success: true,
            data: {
                role: invite.role,
                domain: invite.domain,
            },
        });
    } catch (error) {
        console.error("GET /api/invitations/validate error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
