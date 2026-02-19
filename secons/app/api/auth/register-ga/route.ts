import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createFirebaseUser, setCustomClaims } from "@/lib/firebase-admin";
import { authRateLimit } from "@/lib/rate-limiter";
import { logInfo } from "@/lib/audit-logger";
import type { ApiResponse } from "@/types/api";

// ============================================================
// POST /api/auth/register-ga — Register as General Animator
// Only works when no active GA exists
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

        const body = await req.json();
        const { name, email, password } = body;

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Name, email, and password are required" },
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

        // Check if an active GA already exists
        const existingGA = await User.findOne({ role: "ga", isActive: true }).lean();
        if (existingGA) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "A General Animator already exists. Registration is closed." },
                { status: 409 }
            );
        }

        // Check if email already used
        const existingUser = await User.findOne({ email: email.toLowerCase() }).lean();
        if (existingUser) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Create Firebase user
        const firebaseUser = await createFirebaseUser(email, password, name);

        // Set custom claims
        await setCustomClaims(firebaseUser.uid, { role: "ga", domain: "general" });

        // Create MongoDB user
        const newUser = await User.create({
            uid: firebaseUser.uid,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            role: "ga",
            domain: "general",
            isActive: true,
            onboardingComplete: false,
            tourComplete: false,
            lastActiveAt: new Date(),
        });

        await logInfo("USER_CREATED", String(newUser._id), {
            action: "GA_REGISTRATION",
            email: email.toLowerCase(),
        });

        return NextResponse.json<ApiResponse<{ uid: string; role: string }>>({
            success: true,
            data: { uid: firebaseUser.uid, role: "ga" },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/auth/register-ga error:", error);

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
