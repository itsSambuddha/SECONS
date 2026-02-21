import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import Message from "@/models/Message";
import User from "@/models/User";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { UserRole } from "@/types/auth";

// ============================================================
// GET /api/chat/threads — List threads for current user
// ============================================================
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        const user = await User.findOne({ uid: decoded.uid }).lean();
        if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

        // Find all threads where user is a participant and not archived
        const threads = await ChatThread.find({
            participants: decoded.uid,
            isArchived: { $ne: true },
        })
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .lean();

        // Enrich each thread with last message preview + unread count
        const enriched = await Promise.all(
            threads.map(async (thread) => {
                const [lastMessage, unreadCount] = await Promise.all([
                    Message.findOne({ threadId: thread._id, deletedAt: { $exists: false } })
                        .sort({ sentAt: -1 })
                        .select("content senderId sentAt")
                        .lean(),
                    Message.countDocuments({
                        threadId: thread._id,
                        readBy: { $nin: [decoded.uid] },
                        senderId: { $ne: decoded.uid },
                        deletedAt: { $exists: false },
                    }),
                ]);

                // If this is a 1-on-1 DM, dynamically fetch the other participant's details
                let displayName = thread.name;
                let displayAvatar = thread.avatar;

                if ((thread.type === "custom" || thread.type === "volunteer") && thread.participants.length === 2) {
                    const otherUid = thread.participants.find((p: string) => p !== decoded.uid);
                    if (otherUid) {
                        const otherUser = await User.findOne({ uid: otherUid }).select("name photoURL").lean();
                        if (otherUser) {
                            displayName = otherUser.name;
                            displayAvatar = otherUser.photoURL || undefined;
                        }
                    }
                }

                return {
                    _id: String(thread._id),
                    type: thread.type,
                    name: displayName,
                    description: thread.description,
                    avatar: displayAvatar,
                    domain: thread.domain,
                    participants: thread.participants,
                    participantCount: thread.participants.length,
                    createdBy: thread.createdBy,
                    lastMessageAt: thread.lastMessageAt,
                    lastMessage: lastMessage
                        ? {
                            content: lastMessage.content,
                            senderId: lastMessage.senderId,
                            sentAt: lastMessage.sentAt,
                        }
                        : null,
                    unreadCount,
                };
            })
        );

        return NextResponse.json({ success: true, data: enriched });
    } catch (error) {
        console.error("GET /api/chat/threads error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// POST /api/chat/threads — Create new thread
// ============================================================
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        const role = (decoded.role as UserRole) || "student";
        await connectDB();

        const body = await req.json();
        const { type, name, description, domain, eventId, participantUids } = body;

        if (!type || !name) {
            return NextResponse.json({ success: false, error: "Type and name are required" }, { status: 400 });
        }

        // Validate permissions per PRD
        if (type === "custom" && role !== "ga") {
            return NextResponse.json({ success: false, error: "Only GA can create custom threads" }, { status: 403 });
        }
        if (type === "workspace" && role !== "ga" && role !== "jga") {
            return NextResponse.json({ success: false, error: "Only GA/JGA can create workspace threads" }, { status: 403 });
        }
        if (type === "volunteer" && role !== "ga" && role !== "jga" && role !== "animator") {
            return NextResponse.json({ success: false, error: "Only managers can create volunteer threads" }, { status: 403 });
        }

        // Auto-populate participants based on thread type
        let participants: string[] = [];

        switch (type) {
            case "workspace": {
                // GA + all JGAs
                const admins = await User.find({ role: { $in: ["ga", "jga"] }, isActive: true }).select("uid").lean();
                participants = admins.map((u) => u.uid);
                break;
            }
            case "domain": {
                if (!domain) return NextResponse.json({ success: false, error: "Domain required for domain threads" }, { status: 400 });
                // JGA of domain + all animators in domain
                const domainUsers = await User.find({
                    domain,
                    role: { $in: ["jga", "animator"] },
                    isActive: true,
                }).select("uid").lean();
                participants = domainUsers.map((u) => u.uid);
                break;
            }
            case "event": {
                // GA + relevant JGA + specified animators
                const gas = await User.find({ role: "ga", isActive: true }).select("uid").lean();
                participants = [...gas.map((u) => u.uid)];
                if (participantUids?.length) {
                    participants = [...new Set([...participants, ...participantUids])];
                }
                break;
            }
            case "volunteer": {
                // Animator (creator) + specified volunteers
                participants = [decoded.uid];
                if (participantUids?.length) {
                    participants = [...new Set([...participants, ...participantUids])];
                }
                break;
            }
            case "custom": {
                // GA-defined participants
                participants = participantUids?.length ? [...new Set([decoded.uid, ...participantUids])] : [decoded.uid];
                break;
            }
        }

        // Ensure creator is always a participant
        if (!participants.includes(decoded.uid)) {
            participants.push(decoded.uid);
        }

        const thread = await ChatThread.create({
            type,
            name,
            description,
            domain,
            eventId,
            participants,
            createdBy: decoded.uid,
        });

        return NextResponse.json({ success: true, data: { _id: String(thread._id), name: thread.name, type: thread.type, participants: thread.participants } }, { status: 201 });
    } catch (error) {
        console.error("POST /api/chat/threads error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
