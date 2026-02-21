import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";

// ============================================================
// GET /api/notifications — Fetch current user's notifications
// ============================================================
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        // Fetch user notifications sorted newest-first
        const notifications = await Notification.find({ userId: decoded.uid })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = await Notification.countDocuments({
            userId: decoded.uid,
            isRead: false,
        });

        return NextResponse.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
        console.error("GET /api/notifications error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// PATCH /api/notifications — Mark *ALL* as read
// ============================================================
export async function PATCH(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        await Notification.updateMany(
            { userId: decoded.uid, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("PATCH /api/notifications error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// DELETE /api/notifications — Clear *ALL* notifications
// ============================================================
export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        await Notification.deleteMany({ userId: decoded.uid });

        return NextResponse.json({ success: true, message: "All notifications cleared" });
    } catch (error) {
        console.error("DELETE /api/notifications error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
