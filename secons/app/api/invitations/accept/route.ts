import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import InvitationToken from "@/models/InvitationToken";
import User from "@/models/User";
import { createFirebaseUser, setCustomClaims } from "@/lib/firebase-admin";
import { authRateLimit } from "@/lib/rate-limiter";
import { logAuth } from "@/lib/audit-logger";
import type { ApiResponse } from "@/types/api";
import type { UserRole, UserDomain } from "@/types/auth";

// ============================================================
// POST /api/invitations/accept — Accept an invitation
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

        const body = await req.json();
        const { token, password, invitationId } = body;

        if (!token || !password || !invitationId) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Token, password, and invitation ID are required" },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || password.length < 8) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the invitation
        const invitation = await InvitationToken.findById(invitationId);
        if (!invitation) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invitation not found" },
                { status: 404 }
            );
        }

        // Check if already used
        if (invitation.used) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "This invitation has already been used" },
                { status: 400 }
            );
        }

        // Check expiry
        if (new Date() > invitation.expiresAt) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "This invitation has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Verify token hash
        const isValid = await bcrypt.compare(token, invitation.tokenHash);
        if (!isValid) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invalid invitation token" },
                { status: 400 }
            );
        }

        // Check if email already registered
        const existingUser = await User.findOne({ email: invitation.email }).lean();
        if (existingUser) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Create Firebase user
        const firebaseUser = await createFirebaseUser(invitation.email, password, invitation.name);

        // Set custom claims
        await setCustomClaims(firebaseUser.uid, {
            role: invitation.role as UserRole,
            domain: (invitation.domain || "general") as UserDomain,
        });

        // Create MongoDB user
        const newUser = await User.create({
            uid: firebaseUser.uid,
            name: invitation.name,
            email: invitation.email,
            role: invitation.role,
            domain: invitation.domain || "general",
            isActive: true,
            onboardingComplete: false,
            tourComplete: false,
            lastActiveAt: new Date(),
        });

        // Mark invitation as used
        invitation.used = true;
        await invitation.save();

        await logAuth("USER_LOGIN", "INFO", String(newUser._id), {
            action: "INVITATION_ACCEPTED",
            email: invitation.email,
            role: invitation.role,
        });

        return NextResponse.json<ApiResponse<{ uid: string; email: string; role: string }>>({
            success: true,
            data: {
                uid: firebaseUser.uid,
                email: invitation.email,
                role: invitation.role,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/invitations/accept error:", error);

        const message = (error as Error).message;
        if (message.includes("email-already-exists")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "This email is already registered in Firebase" },
                { status: 409 }
            );
        }

        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
