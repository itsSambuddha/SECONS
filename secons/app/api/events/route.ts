import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import Notification from "@/models/Notification";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/auth";

// ============================================================
// GET /api/events — List events
// Public: returns published events only
// Admin (GA/JGA): returns all events
// ============================================================
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const category = searchParams.get("category");
        const status = searchParams.get("status");
        const domain = searchParams.get("domain");

        // Check if admin (optional auth)
        let isAdmin = false;
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            try {
                const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
                const role = decoded.role as UserRole;
                isAdmin = role === "ga" || role === "jga";
            } catch {
                // Not admin, proceed as public
            }
        }

        const query: Record<string, unknown> = {};

        // Public users only see published/ongoing/completed events
        if (!isAdmin) {
            query.status = { $in: ["published", "ongoing", "completed"] };
        } else if (status) {
            query.status = status;
        }

        if (category) query.category = category;
        if (domain) query.jgaDomain = domain;

        const [events, total] = await Promise.all([
            Event.find(query)
                .sort({ startDateTime: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Event.countDocuments(query),
        ]);

        return NextResponse.json<ApiResponse<{
            events: unknown[];
            total: number;
            page: number;
            totalPages: number;
        }>>({
            success: true,
            data: {
                events,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("GET /api/events error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// POST /api/events — Create a new event (GA/JGA only)
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
        const role = decoded.role as UserRole;

        if (role !== "ga" && role !== "jga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only GA or JGA can create events" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { title, category, description, rules, eligibility, venue, startDateTime, endDateTime, jgaDomain, registrationLink, flierUrl, status: eventStatus } = body;

        if (!title || !category || !description || !venue || !startDateTime || !endDateTime || !jgaDomain) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Missing required fields: title, category, description, venue, startDateTime, endDateTime, jgaDomain" },
                { status: 400 }
            );
        }

        await connectDB();

        // Get creator's user ID
        const User = (await import("@/models/User")).default;
        const creator = await User.findOne({ uid: decoded.uid }).lean();
        if (!creator) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const event = await Event.create({
            title,
            category,
            description,
            rules: rules || "",
            eligibility: eligibility || "",
            venue,
            startDateTime: new Date(startDateTime),
            endDateTime: new Date(endDateTime),
            jgaDomain,
            registrationLink: registrationLink || "",
            flierUrl: flierUrl || "",
            status: eventStatus || "draft",
            animatorId: creator._id,
        });

        // If the event is published, notify all active users
        if (event.status === "published") {
            const allUsers = await User.find({ uid: { $ne: decoded.uid }, isActive: true }).select("uid").lean();
            if (allUsers.length > 0) {
                const notifications = allUsers.map(u => ({
                    userId: u.uid,
                    type: "system",
                    title: `New Event: ${event.title}`,
                    body: `A new ${event.category} event has been published!`,
                    link: `/all-events`,
                }));
                await Notification.insertMany(notifications).catch(err => console.error("Failed to insert event notifications", err));
            }
        }

        return NextResponse.json<ApiResponse<{ event: unknown }>>({
            success: true,
            data: { event },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/events error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
