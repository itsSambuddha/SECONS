import { NextRequest, NextResponse } from "next/server";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { UserRole } from "@/types/auth";
import type { ApiResponse } from "@/types/api";
import { apiRateLimit, authRateLimit } from "@/lib/rate-limiter";

// ============================================================
// withAuth — Higher-Order Function for API Route Protection
// ============================================================

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        uid: string;
        email: string;
        role: UserRole;
        domain: string;
    };
}

type RouteHandler = (
    req: NextRequest,
    context: {
        params: Record<string, string>;
        user: { uid: string; email: string; role: UserRole; domain: string };
    }
) => Promise<NextResponse<ApiResponse<any>>>;

export function withAuth(handler: RouteHandler, allowedRoles: UserRole[]) {
    return async (
        req: NextRequest,
        context: { params: Promise<Record<string, string>> }
    ): Promise<NextResponse<ApiResponse<any>>> => {
        try {
            // Rate limiting
            const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
            const rateCheck = apiRateLimit(ip);
            if (!rateCheck.allowed) {
                return NextResponse.json(
                    { success: false, error: "Too many requests. Please try again later." },
                    {
                        status: 429,
                        headers: {
                            "Retry-After": String(Math.ceil(rateCheck.resetInMs / 1000)),
                            "X-RateLimit-Remaining": "0",
                        },
                    }
                );
            }

            // Extract token
            const authHeader = req.headers.get("authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return NextResponse.json(
                    { success: false, error: "Authentication required. Provide a valid Bearer token." },
                    { status: 401 }
                );
            }

            const token = authHeader.split("Bearer ")[1];

            // Verify token
            const decoded = await verifyAndDecodeToken(token);
            const role = (decoded.role as UserRole) || "student";
            const domain = (decoded.domain as string) || "general";

            // Check role authorization
            if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
                return NextResponse.json(
                    { success: false, error: "You do not have permission to perform this action." },
                    { status: 403 }
                );
            }

            const resolvedParams = await context.params;

            // Call the handler with authenticated user context
            return handler(req, {
                params: resolvedParams,
                user: {
                    uid: decoded.uid,
                    email: decoded.email || "",
                    role,
                    domain,
                },
            });
        } catch (error) {
            const message = (error as Error).message;

            if (message.includes("Token verification failed") || message.includes("token")) {
                return NextResponse.json(
                    { success: false, error: "Invalid or expired authentication token." },
                    { status: 401 }
                );
            }

            console.error("Auth middleware error:", error);
            return NextResponse.json(
                { success: false, error: "Internal server error" },
                { status: 500 }
            );
        }
    };
}

// Shorthand for routes accessible by all authenticated users
export function withAnyAuth(handler: RouteHandler) {
    return withAuth(handler, []);
}

// Shorthand for GA-only routes
export function withGAAuth(handler: RouteHandler) {
    return withAuth(handler, ["ga"]);
}

// Shorthand for GA + JGA routes
export function withAdminAuth(handler: RouteHandler) {
    return withAuth(handler, ["ga", "jga"]);
}

// Shorthand for GA + JGA + Animator routes
export function withManagerAuth(handler: RouteHandler) {
    return withAuth(handler, ["ga", "jga", "animator"]);
}
