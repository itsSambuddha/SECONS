import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyAndDecodeToken, setCustomClaims } from "@/lib/firebase-admin";
import { authRateLimit } from "@/lib/rate-limiter";
import { logInfo } from "@/lib/audit-logger";
import type { ApiResponse } from "@/types/api";

// ============================================================
// POST /api/auth/register-ga — Register as General Animator
// Only works when no active GA exists in the system
// Expects Firebase ID Token from Google Auth in Authorization header
// ============================================================
export async function POST(req: NextRequest) {
    try {
        // Rate limit
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const rateCheck = authRateLimit(ip);
        if (!rateCheck.allowed) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Too many attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.resetInMs / 1000)) } }
            );
        }

        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await verifyAndDecodeToken(token);

        if (!decodedToken.email) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Email missing from token" },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if an active GA already exists
        const existingGA = await User.findOne({ role: "ga", isActive: true }).lean();
        if (existingGA) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "A General Animator already exists. Registration is closed." },
                { status: 409 }
            );
        }

        // Check if DB user already exists for this email
        const existingUser = await User.findOne({ email: decodedToken.email.toLowerCase() }).lean();
        if (existingUser) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Set custom claims
        await setCustomClaims(decodedToken.uid, { role: "ga", domain: "general" });

        // Create MongoDB user
        const newUser = await User.create({
            uid: decodedToken.uid,
            name: decodedToken.name || "General Animator",
            email: decodedToken.email.toLowerCase().trim(),
            role: "ga",
            domain: "general",
            isActive: true,
            onboardingComplete: false,
            tourComplete: false,
            lastActiveAt: new Date(),
        });

        await logInfo("USER_CREATED", String(newUser._id), {
            action: "GA_REGISTRATION",
            email: decodedToken.email,
        });

        return NextResponse.json<ApiResponse<{ uid: string; role: string }>>({
            success: true,
            data: { uid: decodedToken.uid, role: "ga" },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/auth/register-ga error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: (error as Error).message || "Internal server error" },
            { status: 500 }
        );
    }
}
