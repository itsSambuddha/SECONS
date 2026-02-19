import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import InvitationToken from "@/models/InvitationToken";
import User from "@/models/User";
import { verifyAndDecodeToken, setCustomClaims } from "@/lib/firebase-admin";
import { authRateLimit } from "@/lib/rate-limiter";
import { logAuth } from "@/lib/audit-logger";
import type { ApiResponse } from "@/types/api";
import type { UserRole, UserDomain } from "@/types/auth";

// ============================================================
// POST /api/invitations/accept — Accept an invitation with Google Auth
// Expects: { code: string } in body and Google ID Token in Authorization header
// ============================================================
export async function POST(req: NextRequest) {
    try {
        // Rate limit
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const rateCheck = authRateLimit(ip);
        if (!rateCheck.allowed) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Too many attempts. Please try again later." },
                { status: 429 }
            );
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Access code is required" },
                { status: 400 }
            );
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await verifyAndDecodeToken(token);

        if (!decodedToken.email) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Email missing from Google token" },
                { status: 400 }
            );
        }

        await connectDB();

        // 1. Find and validate the invitation
        const invite = await InvitationToken.findOne({
            token: code.toUpperCase(),
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!invite) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invalid or expired access code" },
                { status: 404 }
            );
        }

        // 2. Check if MongoDB user already exists
        let user = await User.findOne({ email: decodedToken.email.toLowerCase() });
        if (user) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // 3. Set custom claims in Firebase
        await setCustomClaims(decodedToken.uid, {
            role: invite.role as UserRole,
            domain: (invite.domain || "general") as UserDomain,
        });

        // 4. Create MongoDB user record
        user = await User.create({
            uid: decodedToken.uid,
            name: decodedToken.name || invite.name,
            email: decodedToken.email.toLowerCase(),
            role: invite.role,
            domain: invite.domain || "general",
            isActive: true,
            onboardingComplete: false,
            tourComplete: false,
            lastActiveAt: new Date(),
        });

        // 5. Mark invitation as used
        invite.used = true;
        await invite.save();

        await logAuth("USER_CREATED", "INFO", String(user._id), {
            action: "INVITATION_ACCEPTED",
            email: decodedToken.email,
            role: invite.role,
            code: invite.token,
        });

        return NextResponse.json<ApiResponse<{ uid: string; role: string }>>({
            success: true,
            data: { uid: decodedToken.uid, role: invite.role },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/invitations/accept error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: (error as Error).message || "Internal server error" },
            { status: 500 }
        );
    }
}
