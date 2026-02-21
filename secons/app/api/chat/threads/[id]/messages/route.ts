import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import Message from "@/models/Message";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";

// ============================================================
// GET /api/chat/threads/[id]/messages — Paginated messages
// ============================================================
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const searchParams = req.nextUrl.searchParams;
        const cursor = searchParams.get("cursor"); // sentAt ISO string for pagination
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const after = searchParams.get("after"); // For polling: get messages after this timestamp

        const query: Record<string, unknown> = { threadId: id };

        if (after) {
            // Polling mode: get messages newer than this timestamp
            query.sentAt = { $gt: new Date(after) };
        } else if (cursor) {
            // Pagination mode: get older messages
            query.sentAt = { $lt: new Date(cursor) };
        }

        const messages = await Message.find(query)
            .sort({ sentAt: after ? 1 : -1 }) // Ascending for polling, descending for pagination
            .limit(limit)
            .lean();

        // Get sender info for all unique senders
        const senderIds = [...new Set(messages.map((m) => m.senderId))];
        const senders = await User.find({ uid: { $in: senderIds } })
            .select("uid name photoURL role")
            .lean();
        const senderMap = Object.fromEntries(senders.map((s) => [s.uid, { name: s.name, photoURL: s.photoURL, role: s.role }]));

        // Get reply-to messages if any
        const replyIds = messages.filter((m) => m.replyTo).map((m) => m.replyTo);
        const replyMessages = replyIds.length
            ? await Message.find({ _id: { $in: replyIds } })
                .select("content senderId")
                .lean()
            : [];
        const replyMap = Object.fromEntries(replyMessages.map((r) => [String(r._id), { content: r.content, senderId: r.senderId }]));

        const enriched = messages.map((m) => ({
            _id: String(m._id),
            threadId: String(m.threadId),
            senderId: m.senderId,
            sender: senderMap[m.senderId] || { name: "Unknown", photoURL: null, role: "student" },
            content: m.deletedAt ? "This message was deleted" : m.content,
            attachments: m.deletedAt ? [] : m.attachments,
            replyTo: m.replyTo
                ? {
                    _id: String(m.replyTo),
                    ...(replyMap[String(m.replyTo)] || { content: "Message not found", senderId: "" }),
                    senderName: replyMap[String(m.replyTo)]
                        ? senderMap[replyMap[String(m.replyTo)].senderId]?.name || "Unknown"
                        : "Unknown",
                }
                : null,
            readBy: m.readBy,
            pinned: m.pinned,
            edited: m.edited,
            isDeleted: !!m.deletedAt,
            reactions: m.reactions,
            sentAt: m.sentAt,
        }));

        // If descending (normal load), reverse so oldest is first for rendering
        if (!after) enriched.reverse();

        return NextResponse.json({
            success: true,
            data: {
                messages: enriched,
                hasMore: messages.length === limit,
                cursor: messages.length > 0 ? messages[messages.length - 1].sentAt.toISOString() : null,
            },
        });
    } catch (error) {
        console.error("GET /api/chat/threads/[id]/messages error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// POST /api/chat/threads/[id]/messages — Send message
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
            return NextResponse.json({ success: false, error: "You are not a participant in this thread" }, { status: 403 });
        }

        const body = await req.json();
        const { content, attachments, replyTo } = body;

        if (!content?.trim() && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ success: false, error: "Message content or attachment required" }, { status: 400 });
        }

        const message = await Message.create({
            threadId: id,
            senderId: decoded.uid,
            content: content?.trim() || "",
            attachments: attachments || [],
            replyTo: replyTo || undefined,
            readBy: [decoded.uid], // Sender has read their own message
        });

        // Update thread lastMessageAt
        await ChatThread.findByIdAndUpdate(id, { lastMessageAt: message.sentAt });

        // Get sender info
        const sender = await User.findOne({ uid: decoded.uid }).select("uid name photoURL role").lean();

        // Generate notifications for other participants
        const otherParticipants = thread.participants.filter((uid: string) => uid !== decoded.uid);
        if (otherParticipants.length > 0) {
            const notifications = otherParticipants.map((uid: string) => ({
                userId: uid,
                type: "chat",
                title: `Message from ${sender?.name || "Someone"}`,
                body: message.content || "Sent an attachment",
                link: `/chat?thread=${id}`,
            }));
            await Notification.insertMany(notifications);
        }

        return NextResponse.json({
            success: true,
            data: {
                _id: String(message._id),
                threadId: String(message.threadId),
                senderId: message.senderId,
                sender: sender ? { name: sender.name, photoURL: sender.photoURL, role: sender.role } : { name: "Unknown", photoURL: null, role: "student" },
                content: message.content,
                attachments: message.attachments,
                replyTo: null,
                readBy: message.readBy,
                pinned: false,
                edited: false,
                isDeleted: false,
                reactions: [],
                sentAt: message.sentAt,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/chat/threads/[id]/messages error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
