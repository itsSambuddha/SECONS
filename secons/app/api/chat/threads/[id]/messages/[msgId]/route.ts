import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import Message from "@/models/Message";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { UserRole } from "@/types/auth";

// ============================================================
// PATCH /api/chat/threads/[id]/messages/[msgId] — Edit message
// ============================================================
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; msgId: string }> }) {
    try {
        const { id, msgId } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        const message = await Message.findOne({ _id: msgId, threadId: id });
        if (!message) return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });

        // Verify user is a participant in this thread
        const thread = await ChatThread.findById(id).lean();
        if (!thread || !thread.participants.includes(decoded.uid)) {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        const body = await req.json();
        const { content, reaction } = body;

        // Handle reaction toggle — ANY participant can react
        if (reaction) {
            const existingIdx = message.reactions.findIndex((r: { emoji: string }) => r.emoji === reaction);
            if (existingIdx >= 0) {
                const existing = message.reactions[existingIdx];
                if (existing.userIds.includes(decoded.uid)) {
                    existing.userIds = existing.userIds.filter((uid: string) => uid !== decoded.uid);
                    if (existing.userIds.length === 0) {
                        message.reactions.splice(existingIdx, 1);
                    }
                } else {
                    existing.userIds.push(decoded.uid);
                }
            } else {
                message.reactions.push({ emoji: reaction, userIds: [decoded.uid] });
            }
            await message.save();
            return NextResponse.json({ success: true, data: { reactions: message.reactions } });
        }

        // Content edit — ONLY sender can edit
        if (message.senderId !== decoded.uid) {
            return NextResponse.json({ success: false, error: "You can only edit your own messages" }, { status: 403 });
        }

        // 15-minute edit window
        const ageMs = Date.now() - new Date(message.sentAt).getTime();
        if (ageMs > 15 * 60 * 1000) {
            return NextResponse.json({ success: false, error: "Edit window expired (15 min)" }, { status: 400 });
        }

        if (message.deletedAt) {
            return NextResponse.json({ success: false, error: "Cannot edit a deleted message" }, { status: 400 });
        }

        if (content?.trim()) {
            message.content = content.trim();
            message.edited = true;
            await message.save();
            return NextResponse.json({ success: true, data: { message: "Message updated", edited: true } });
        }

        return NextResponse.json({ success: false, error: "No changes provided" }, { status: 400 });
    } catch (error) {
        console.error("PATCH /api/chat/threads/[id]/messages/[msgId] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// DELETE /api/chat/threads/[id]/messages/[msgId] — Soft delete
// ============================================================
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; msgId: string }> }) {
    try {
        const { id, msgId } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        const role = (decoded.role as UserRole) || "student";
        await connectDB();

        const message = await Message.findOne({ _id: msgId, threadId: id });
        if (!message) return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });

        // Sender or GA can delete
        if (message.senderId !== decoded.uid && role !== "ga") {
            return NextResponse.json({ success: false, error: "You can only delete your own messages" }, { status: 403 });
        }

        message.deletedAt = new Date();
        await message.save();

        return NextResponse.json({ success: true, data: { message: "Message deleted" } });
    } catch (error) {
        console.error("DELETE /api/chat/threads/[id]/messages/[msgId] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
