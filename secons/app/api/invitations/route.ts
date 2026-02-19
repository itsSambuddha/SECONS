import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import InvitationToken from "@/models/InvitationToken";
import User from "@/models/User";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import { sendInvitationEmail } from "@/lib/mailer";
import { hasAuthority, type UserRole } from "@/types/auth";
import { authRateLimit } from "@/lib/rate-limiter";
import { logAuth } from "@/lib/audit-logger";
import type { ApiResponse } from "@/types/api";

// ============================================================
// POST /api/invitations — Create invitation
// ============================================================
export async function POST(req: NextRequest) {
    try {
        // Auth check
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        const inviterRole = (decoded.role as UserRole) || "student";

        // Only GA and JGA can invite
        if (inviterRole !== "ga" && inviterRole !== "jga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only GA and JGA can send invitations" },
                { status: 403 }
            );
        }

        // Rate limit
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const rateCheck = authRateLimit(ip);
        if (!rateCheck.allowed) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Too many requests" },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { name, email, role, domain } = body;

        if (!name || !email || !role) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Name, email, and role are required" },
                { status: 400 }
            );
        }

        // Validate role assignment permissions
        const targetRole = role as UserRole;
        if (targetRole === "ga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Cannot invite a GA. GA registers directly." },
                { status: 400 }
            );
        }

        if (!hasAuthority(inviterRole, targetRole)) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "You cannot invite someone with equal or higher authority" },
                { status: 403 }
            );
        }

        await connectDB();

        // Check if email already has an account
        const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
        if (existingUser) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "This email already has an account" },
                { status: 409 }
            );
        }

        // Check for an unused pending invitation for this email
        const existingInvite = await InvitationToken.findOne({
            email: email.toLowerCase(),
            used: false,
            expiresAt: { $gt: new Date() },
        }).lean();
        if (existingInvite) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "A pending invitation already exists for this email" },
                { status: 409 }
            );
        }

        // Generate token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = await bcrypt.hash(rawToken, 10);

        // Get inviter user
        const inviter = await User.findOne({ uid: decoded.uid }).lean();

        const invitation = await InvitationToken.create({
            tokenHash,
            email: email.toLowerCase().trim(),
            name: name.trim(),
            role: targetRole,
            domain: domain || "general",
            invitedBy: inviter ? String(inviter._id) : decoded.uid,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        });

        // Send email
        const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/accept?token=${rawToken}&id=${invitation._id}`;
        try {
            await sendInvitationEmail(email, {
                inviteeName: name,
                role: targetRole,
                domain: domain || "general",
                inviterName: inviter?.name || "SECONS Admin",
                acceptUrl,
            });
        } catch (emailError) {
            console.error("Failed to send invitation email:", emailError);
            // Don't fail the whole request if email fails — the token is still valid
        }

        await logAuth("USER_LOGIN", "INFO", inviter ? String(inviter._id) : decoded.uid, {
            action: "INVITATION_SENT",
            targetEmail: email,
            targetRole,
        });

        return NextResponse.json<ApiResponse<{ invitationId: string; acceptUrl: string }>>({
            success: true,
            data: {
                invitationId: String(invitation._id),
                acceptUrl,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/invitations error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// GET /api/invitations — List invitations (admin only)
// ============================================================
export async function GET(req: NextRequest) {
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
                { success: false, error: "Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const status = searchParams.get("status"); // "pending" | "used" | "expired"

        const query: Record<string, unknown> = {};
        if (status === "pending") {
            query.used = false;
            query.expiresAt = { $gt: new Date() };
        } else if (status === "used") {
            query.used = true;
        } else if (status === "expired") {
            query.used = false;
            query.expiresAt = { $lte: new Date() };
        }

        const [invitations, total] = await Promise.all([
            InvitationToken.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            InvitationToken.countDocuments(query),
        ]);

        return NextResponse.json<ApiResponse<{ invitations: unknown[]; total: number; page: number; totalPages: number }>>({
            success: true,
            data: {
                invitations: invitations.map((inv) => ({
                    _id: String(inv._id),
                    email: inv.email,
                    name: inv.name,
                    role: inv.role,
                    domain: inv.domain,
                    used: inv.used,
                    expiresAt: inv.expiresAt,
                    createdAt: inv.createdAt,
                })),
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("GET /api/invitations error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
