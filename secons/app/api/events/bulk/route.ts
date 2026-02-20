import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/auth";

// ============================================================
// POST /api/events/bulk — Bulk create events from CSV data (GA only)
// Expected body: { events: Array<EventRow> }
// Each EventRow: { title, category, venue, startDateTime, endDateTime, jgaDomain, description? }
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

        if (role !== "ga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only the General Animator can bulk-create events" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { events: eventRows } = body;

        if (!Array.isArray(eventRows) || eventRows.length === 0) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "events array is required and must not be empty" },
                { status: 400 }
            );
        }

        if (eventRows.length > 100) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Maximum 100 events per bulk upload" },
                { status: 400 }
            );
        }

        await connectDB();

        // Get creator
        const User = (await import("@/models/User")).default;
        const creator = await User.findOne({ uid: decoded.uid }).lean();
        if (!creator) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const validCategories = ["sports", "literary", "performing_creative_arts", "club", "miscellaneous"];
        const results: { success: number; failed: number; errors: string[] } = {
            success: 0,
            failed: 0,
            errors: [],
        };

        const validEvents = [];

        for (let i = 0; i < eventRows.length; i++) {
            const row = eventRows[i];
            const rowNum = i + 1;

            // Validate required fields
            if (!row.title || !row.category || !row.venue || !row.startDateTime || !row.endDateTime || !row.jgaDomain) {
                results.failed++;
                results.errors.push(`Row ${rowNum}: Missing required fields (title, category, venue, startDateTime, endDateTime, jgaDomain)`);
                continue;
            }

            if (!validCategories.includes(row.category)) {
                results.failed++;
                results.errors.push(`Row ${rowNum}: Invalid category "${row.category}". Must be one of: ${validCategories.join(", ")}`);
                continue;
            }

            const startDate = new Date(row.startDateTime);
            const endDate = new Date(row.endDateTime);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                results.failed++;
                results.errors.push(`Row ${rowNum}: Invalid date format`);
                continue;
            }

            validEvents.push({
                title: row.title.trim(),
                category: row.category,
                description: row.description?.trim() || `Event: ${row.title}`,
                rules: row.rules || "",
                eligibility: row.eligibility || "",
                venue: row.venue.trim(),
                startDateTime: startDate,
                endDateTime: endDate,
                jgaDomain: row.jgaDomain.trim(),
                registrationLink: row.registrationLink || "",
                flierUrl: row.flierUrl || "",
                status: "draft",
                animatorId: creator._id,
            });
        }

        if (validEvents.length > 0) {
            await Event.insertMany(validEvents);
            results.success = validEvents.length;
        }

        return NextResponse.json<ApiResponse<typeof results>>({
            success: true,
            data: results,
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/events/bulk error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
