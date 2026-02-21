import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import Notification from "@/models/Notification";

// ============================================================
// PATCH /api/meetings/[id] — Update meeting details (GA only)
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

        if (decoded.role !== "ga") {
            return NextResponse.json({ success: false, error: "Only GAs can update meetings" }, { status: 403 });
        }

        const body = await req.json();
        const allowedUpdates = ["title", "agenda", "scheduledAt", "location", "meetingLink", "notes"];

        const updates: any = {};
        for (const field of allowedUpdates) {
            if (body[field] !== undefined) {
                if (field === "scheduledAt") {
                    updates[field] = new Date(body[field]);
                } else {
                    updates[field] = body[field];
                }
            }
        }

        const meeting = await Meeting.findByIdAndUpdate(id, updates, { new: true });
        if (!meeting) {
            return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
        }

        // Notify attendees if time/location changes
        if (updates.scheduledAt || updates.location || updates.meetingLink) {
            const notifyIds = meeting.attendeeIds.filter((uid: string) => uid !== decoded.uid);
            if (notifyIds.length > 0) {
                const notifications = notifyIds.map((uid: string) => ({
                    userId: uid,
                    type: "meeting",
                    title: `🔄 Meeting Updated: ${meeting.title}`,
                    body: `Check the new details for this meeting.`,
                    link: `/meetings`,
                }));
                await Notification.insertMany(notifications).catch(err => console.error("Failed to insert meeting update notifications", err));
            }
        }

        return NextResponse.json({ success: true, data: meeting });
    } catch (error) {
        console.error("PATCH /api/meetings/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// DELETE /api/meetings/[id] — Cancel meeting (GA only)
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
            return NextResponse.json({ success: false, error: "Only GAs can cancel meetings" }, { status: 403 });
        }

        const meeting = await Meeting.findByIdAndDelete(id);
        if (!meeting) {
            return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
        }

        // Notify attendees of cancellation
        const notifyIds = meeting.attendeeIds.filter((uid: string) => uid !== decoded.uid);
        if (notifyIds.length > 0) {
            const notifications = notifyIds.map((uid: string) => ({
                userId: uid,
                type: "meeting",
                title: `❌ Meeting Cancelled: ${meeting.title}`,
                body: `This meeting has been cancelled.`,
                link: `/meetings`, // Could link to a generic past meetings page
            }));
            await Notification.insertMany(notifications).catch(err => console.error("Failed to insert meeting cancellation notifications", err));
        }

        return NextResponse.json({ success: true, message: "Meeting cancelled" });
    } catch (error) {
        console.error("DELETE /api/meetings/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
