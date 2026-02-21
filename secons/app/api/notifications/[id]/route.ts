import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";

// ============================================================
// PATCH /api/notifications/[id] — Mark a single notification as read
// ============================================================
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();
        const { id } = await params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: decoded.uid },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: notification });
    } catch (error) {
        console.error("PATCH /api/notifications/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// DELETE /api/notifications/[id] — Delete a single notification
// ============================================================
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();
        const { id } = await params;

        const notification = await Notification.findOneAndDelete({ _id: id, userId: decoded.uid });

        if (!notification) {
            return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Notification deleted" });
    } catch (error) {
        console.error("DELETE /api/notifications/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
