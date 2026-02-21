import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { ApiResponse } from "@/types/api";
import type { SessionUser } from "@/types/auth";
import { encrypt, decrypt } from "@/lib/encryption";

// ============================================================
// GET /api/auth/me — Get current user profile
// ============================================================
export async function GET(req: NextRequest) {
    try {
        // Extract & verify token
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const token = authHeader.split("Bearer ")[1];
        const decoded = await verifyAndDecodeToken(token);

        await connectDB();
        const user = await User.findOne({ uid: decoded.uid }).lean();

        if (!user) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "User profile not found" },
                { status: 404 }
            );
        }

        // Decrypt PII fields for response
        const sessionUser: SessionUser = {
            _id: String(user._id),
            uid: user.uid,
            name: user.name,
            email: user.email,
            role: user.role,
            domain: user.domain,
            phoneNumber: user.phoneNumber ? decrypt(user.phoneNumber) : undefined,
            whatsappNumber: user.whatsappNumber ? decrypt(user.whatsappNumber) : undefined,
            photoURL: user.photoURL,
            isActive: user.isActive,
            onboardingComplete: user.onboardingComplete,
            tourComplete: user.tourComplete,
        };

        return NextResponse.json<ApiResponse<SessionUser>>({
            success: true,
            data: sessionUser,
        });
    } catch (error) {
        const message = (error as Error).message;
        if (message.includes("Token verification failed")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invalid or expired token" },
                { status: 401 }
            );
        }
        console.error("GET /api/auth/me error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// PATCH /api/auth/me — Update current user profile
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

        const token = authHeader.split("Bearer ")[1];
        const decoded = await verifyAndDecodeToken(token);

        const body = await req.json();

        // Only allow updating specific fields
        const allowedFields = [
            "name",
            "phoneNumber",
            "whatsappNumber",
            "photoURL",
            "onboardingComplete",
            "tourComplete",
        ];

        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                // Encrypt phone numbers
                if ((field === "phoneNumber" || field === "whatsappNumber") && body[field]) {
                    updates[field] = encrypt(body[field]);
                } else {
                    updates[field] = body[field];
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "No valid fields to update" },
                { status: 400 }
            );
        }

        await connectDB();
        const user = await User.findOneAndUpdate(
            { uid: decoded.uid },
            { $set: updates },
            { new: true, lean: true }
        );

        if (!user) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const sessionUser: SessionUser = {
            _id: String(user._id),
            uid: user.uid,
            name: user.name,
            email: user.email,
            role: user.role,
            domain: user.domain,
            phoneNumber: user.phoneNumber ? decrypt(user.phoneNumber) : undefined,
            whatsappNumber: user.whatsappNumber ? decrypt(user.whatsappNumber) : undefined,
            photoURL: user.photoURL,
            isActive: user.isActive,
            onboardingComplete: user.onboardingComplete,
            tourComplete: user.tourComplete,
        };

        return NextResponse.json<ApiResponse<SessionUser>>({
            success: true,
            data: sessionUser,
        });
    } catch (error) {
        const message = (error as Error).message;
        if (message.includes("Token verification failed")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Invalid or expired token" },
                { status: 401 }
            );
        }
        console.error("PATCH /api/auth/me error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
