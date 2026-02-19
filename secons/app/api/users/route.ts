import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAndDecodeToken, setCustomClaims } from "@/lib/firebase-admin";
import { logAuth } from "@/lib/audit-logger";
import type { ApiResponse } from "@/types/api";
import type { UserRole, UserDomain } from "@/types/auth";

// ============================================================
// GET /api/users — List users (GA/JGA only)
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
        const roleFilter = searchParams.get("role");
        const domainFilter = searchParams.get("domain");
        const search = searchParams.get("search");

        const query: Record<string, unknown> = {};
        if (roleFilter) query.role = roleFilter;
        if (domainFilter) query.domain = domainFilter;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select("-phoneNumber -whatsappNumber")
                .sort({ role: 1, name: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        return NextResponse.json<ApiResponse<{ users: unknown[]; total: number; page: number; totalPages: number }>>({
            success: true,
            data: {
                users: users.map((u) => ({
                    _id: String(u._id),
                    uid: u.uid,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    domain: u.domain,
                    photoURL: u.photoURL,
                    isActive: u.isActive,
                    onboardingComplete: u.onboardingComplete,
                    createdAt: u.createdAt,
                })),
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("GET /api/users error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// PATCH /api/users — Update a user's role/domain/status (GA only)
// ============================================================
export async function PATCH(req: NextRequest) {
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

        if (role !== "ga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only the General Animator can modify users" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { userId, updates } = body;

        if (!userId || !updates) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "userId and updates are required" },
                { status: 400 }
            );
        }

        const allowedFields = ["role", "domain", "isActive"];
        const safeUpdates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                safeUpdates[field] = updates[field];
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "No valid fields to update" },
                { status: 400 }
            );
        }

        await connectDB();

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Prevent modifying the GA's own role
        if (targetUser.uid === decoded.uid && safeUpdates.role) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Cannot change your own role" },
                { status: 400 }
            );
        }

        // Update MongoDB
        Object.assign(targetUser, safeUpdates);
        await targetUser.save();

        // Update Firebase custom claims if role or domain changed
        if (safeUpdates.role || safeUpdates.domain) {
            await setCustomClaims(targetUser.uid, {
                role: targetUser.role as UserRole,
                domain: targetUser.domain as UserDomain,
            });
        }

        const actor = await User.findOne({ uid: decoded.uid }).lean();
        await logAuth("USER_LOGIN", "WARNING", actor ? String(actor._id) : decoded.uid, {
            action: "USER_UPDATED",
            targetUserId: userId,
            changes: safeUpdates,
        });

        return NextResponse.json<ApiResponse<{ message: string }>>({
            success: true,
            data: { message: "User updated successfully" },
        });
    } catch (error) {
        console.error("PATCH /api/users error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
