import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// Next.js Middleware — Route Protection
// ============================================================

// Routes that don't require authentication
const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/events",
    "/all-events",
    "/leaderboard",
    "/calendar",
    "/itinerary",
    "/map",
    "/api/health",
];

// Routes that start with these prefixes are public
const publicPrefixes = [
    "/api/health",
    "/api/auth/ga-status",
    "/api/auth/register-ga",
    "/api/invitations/accept",
    "/api/invitations/validate",
    "/api/events",
    "/_next",
    "/favicon.ico",
    "/images",
    "/fonts",
];

function isPublicRoute(pathname: string): boolean {
    // Exact match
    if (publicRoutes.includes(pathname)) return true;

    // Prefix match
    if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;

    // Public event detail pages
    if (/^\/events\/[\w-]+$/.test(pathname)) return true;

    // Public sports pages
    if (/^\/sports\/[\w-]+\/live$/.test(pathname)) return true;

    return false;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // For API routes, check Authorization header
    if (pathname.startsWith("/api/")) {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }
        // Token verification is done in withAuth() for API routes
        return NextResponse.next();
    }

    // For page routes, check for session cookie or redirect to login
    // Firebase auth state is managed client-side, so we allow pages to load
    // and the client-side useAuth hook handles redirection
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes except static files
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
