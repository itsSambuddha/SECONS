import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ChatThread from "@/models/ChatThread";
import User from "@/models/User";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { UserRole } from "@/types/auth";

// ============================================================
// GET /api/chat/threads/[id] — Thread details + participants
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

        const thread = await ChatThread.findById(id).lean();
        if (!thread) return NextResponse.json({ success: false, error: "Thread not found" }, { status: 404 });

        // Ensure user is a participant
        if (!thread.participants.includes(decoded.uid)) {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        // Populate participant info
        const participantUsers = await User.find({ uid: { $in: thread.participants } })
            .select("uid name photoURL role domain")
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                _id: String(thread._id),
                type: thread.type,
                name: thread.name,
                description: thread.description,
                avatar: thread.avatar,
                domain: thread.domain,
                createdBy: thread.createdBy,
                isArchived: thread.isArchived,
                lastMessageAt: thread.lastMessageAt,
                createdAt: thread.createdAt,
                participants: participantUsers.map((u) => ({
                    uid: u.uid,
                    name: u.name,
                    photoURL: u.photoURL,
                    role: u.role,
                    domain: u.domain,
                })),
            },
        });
    } catch (error) {
        console.error("GET /api/chat/threads/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// PATCH /api/chat/threads/[id] — Update thread details
// ============================================================
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        const role = (decoded.role as UserRole) || "student";
        await connectDB();

        const thread = await ChatThread.findById(id);
        if (!thread) return NextResponse.json({ success: false, error: "Thread not found" }, { status: 404 });

        // Only creator or GA can update
        if (thread.createdBy !== decoded.uid && role !== "ga") {
            return NextResponse.json({ success: false, error: "Only the thread creator or GA can update" }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, avatar, isArchived, addParticipants, removeParticipants } = body;

        if (name) thread.name = name;
        if (description !== undefined) thread.description = description;
        if (avatar !== undefined) thread.avatar = avatar;
        if (isArchived !== undefined) thread.isArchived = isArchived;

        if (addParticipants?.length) {
            thread.participants = [...new Set([...thread.participants, ...addParticipants])];
        }
        if (removeParticipants?.length) {
            thread.participants = thread.participants.filter((p: string) => !removeParticipants.includes(p));
        }

        await thread.save();

        return NextResponse.json({ success: true, data: { message: "Thread updated" } });
    } catch (error) {
        console.error("PATCH /api/chat/threads/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
