import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAndDecodeToken, deleteFirebaseUser } from "@/lib/firebase-admin";
import { logAuth } from "@/lib/audit-logger";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/auth";

// ============================================================
// GET /api/users/[id] — Get single user
// ============================================================
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params;

        await connectDB();

        const user = await User.findById(id)
            .select("-phoneNumber -whatsappNumber")
            .lean();

        if (!user) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Non-admins can only view their own profile
        if (role !== "ga" && role !== "jga" && user.uid !== decoded.uid) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Access denied" },
                { status: 403 }
            );
        }

        return NextResponse.json<ApiResponse<unknown>>({
            success: true,
            data: {
                _id: String(user._id),
                uid: user.uid,
                name: user.name,
                email: user.email,
                role: user.role,
                domain: user.domain,
                photoURL: user.photoURL,
                isActive: user.isActive,
                onboardingComplete: user.onboardingComplete,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("GET /api/users/[id] error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// DELETE /api/users/[id] — Deactivate user (GA only)
// ============================================================
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params;

        // GA can delete anyone; users can self-delete
        await connectDB();
        const targetUser = await User.findById(id);

        if (!targetUser) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const isSelfDelete = targetUser.uid === decoded.uid;
        if (role !== "ga" && !isSelfDelete) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only the GA can deactivate other users" },
                { status: 403 }
            );
        }

        // Deactivate in MongoDB
        targetUser.isActive = false;
        await targetUser.save();

        // Delete from Firebase Auth
        try {
            await deleteFirebaseUser(targetUser.uid);
        } catch (fbErr) {
            console.error("Failed to delete Firebase user:", fbErr);
        }

        const actor = await User.findOne({ uid: decoded.uid }).lean();
        await logAuth("USER_LOGIN", "CRITICAL", actor ? String(actor._id) : decoded.uid, {
            action: isSelfDelete ? "SELF_DELETE" : "USER_DEACTIVATED",
            targetUserId: id,
            targetEmail: targetUser.email,
            targetRole: targetUser.role,
        });

        return NextResponse.json<ApiResponse<{ message: string }>>({
            success: true,
            data: { message: isSelfDelete ? "Account deleted" : "User deactivated" },
        });
    } catch (error) {
        console.error("DELETE /api/users/[id] error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
