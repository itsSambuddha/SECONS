import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/auth";

// ============================================================
// GET /api/events/domains — Get distinct event domains/titles
// For JGA domain selection: returns event titles grouped by jgaDomain
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
        const role = decoded.role as UserRole;

        if (role !== "ga" && role !== "jga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Admin access required" },
                { status: 403 }
            );
        }

        await connectDB();

        // Get all distinct jgaDomain values and event titles
        const events = await Event.find(
            { status: { $ne: "cancelled" } },
            { title: 1, jgaDomain: 1, category: 1 }
        )
            .sort({ jgaDomain: 1, title: 1 })
            .lean();

        // Group by jgaDomain
        const grouped: Record<string, { title: string; category: string }[]> = {};
        for (const event of events) {
            const domain = event.jgaDomain || "general";
            if (!grouped[domain]) grouped[domain] = [];
            grouped[domain].push({
                title: event.title,
                category: event.category,
            });
        }

        // Also get distinct domains for dropdown
        const distinctDomains = await Event.distinct("jgaDomain", {
            status: { $ne: "cancelled" },
        });

        return NextResponse.json<ApiResponse<{
            domains: string[];
            eventsByDomain: Record<string, { title: string; category: string }[]>;
        }>>({
            success: true,
            data: {
                domains: distinctDomains,
                eventsByDomain: grouped,
            },
        });
    } catch (error) {
        console.error("GET /api/events/domains error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
