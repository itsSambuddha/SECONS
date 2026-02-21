import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import Message from "@/models/Message";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";

// ============================================================
// POST /api/chat/threads/[id]/read — Mark all as read
// ============================================================
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        // Verify participant
        const thread = await ChatThread.findById(id).lean();
        if (!thread) return NextResponse.json({ success: false, error: "Thread not found" }, { status: 404 });
        if (!thread.participants.includes(decoded.uid)) {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        // Bulk add user to readBy for all unread messages in this thread
        const result = await Message.updateMany(
            {
                threadId: id,
                readBy: { $nin: [decoded.uid] },
            },
            {
                $addToSet: { readBy: decoded.uid },
            }
        );

        return NextResponse.json({
            success: true,
            data: { markedRead: result.modifiedCount },
        });
    } catch (error) {
        console.error("POST /api/chat/threads/[id]/read error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
