import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";

// ============================================================
// PATCH /api/announcements/[id]
// 1. Mark as read (any authenticated user)
// 2. Pin/unpin (GA only)
// ============================================================
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        const body = await req.json();
        const { action, pinned } = body;

        const announcement = await Announcement.findById(id);
        if (!announcement) {
            return NextResponse.json({ success: false, error: "Announcement not found" }, { status: 404 });
        }

        // Action: Mark as Read
        if (action === "mark_read") {
            if (!announcement.readBy.includes(decoded.uid)) {
                announcement.readBy.push(decoded.uid);
                await announcement.save();
            }
            return NextResponse.json({ success: true, message: "Marked as read" });
        }

        // Action: Pin / Unpin (Requires GA)
        if (action === "update") {
            if (decoded.role !== "ga") {
                return NextResponse.json({ success: false, error: "Only GAs can pin announcements" }, { status: 403 });
            }

            if (typeof pinned === "boolean") {
                announcement.pinned = pinned;
            }

            await announcement.save();
            return NextResponse.json({ success: true, data: announcement });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("PATCH /api/announcements/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// DELETE /api/announcements/[id] — Delete Announcement (GA only)
// ============================================================
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        if (decoded.role !== "ga") {
            return NextResponse.json({ success: false, error: "Only GAs can delete announcements" }, { status: 403 });
        }

        const announcement = await Announcement.findByIdAndDelete(id);
        if (!announcement) {
            return NextResponse.json({ success: false, error: "Announcement not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Announcement deleted" });
    } catch (error) {
        console.error("DELETE /api/announcements/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
