import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import InvitationToken from "@/models/InvitationToken";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import { sendInvitationEmail } from "@/lib/mailer";
import type { UserRole } from "@/types/auth";
import type { ApiResponse } from "@/types/api";
import User from "@/models/User";

// ============================================================
// POST /api/invitations/send — Send invitation email for existing code
// ============================================================
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        const role = (decoded.role as UserRole) || "student";

        if (role !== "ga" && role !== "jga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only admins can send invitations" },
                { status: 403 }
            );
        }

        const { token, email } = await req.json();

        if (!token) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Token is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const invitation = await InvitationToken.findOne({ token, used: false }).lean();
        if (!invitation) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invitation not found or already used" },
                { status: 404 }
            );
        }

        // Update email if provided
        let targetEmail = invitation.email;
        if (email && email !== invitation.email) {
            targetEmail = email.toLowerCase().trim();
            // Check for duplicates
            const existingUser = await User.findOne({ email: targetEmail }).lean();
            if (existingUser) {
                return NextResponse.json<ApiResponse<null>>(
                    { success: false, error: "Email already registered" },
                    { status: 409 }
                );
            }
            await InvitationToken.updateOne({ token }, { email: targetEmail });
        }

        if (!targetEmail) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Email address is required to send invite" },
                { status: 400 }
            );
        }

        // Get inviter name
        const inviter = await User.findOne({ uid: decoded.uid }).lean();

        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login?code=${token}`;

        await sendInvitationEmail(targetEmail, {
            inviteeName: invitation.name || "Future Member",
            role: invitation.role,
            domain: invitation.domain,
            inviterName: inviter?.name || "SECONS Admin",
            acceptUrl: loginUrl,
            accessCode: token,
        });

        // Update lastEmailedAt
        await InvitationToken.updateOne({ token }, { lastEmailedAt: new Date() });

        return NextResponse.json<ApiResponse<null>>({
            success: true,
            data: null,
            message: "Invitation sent successfully" // Adding message for toast
        } as any);

    } catch (error) {
        console.error("POST /api/invitations/send error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
