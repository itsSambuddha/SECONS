import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";

// Helper to determine exact user UIDs from groups
const resolveAttendeeGroups = async (groups: string[]): Promise<string[]> => {
    if (!groups || groups.length === 0) return [];

    let query: any = { isActive: true };
    const orConditions: any[] = [];

    if (groups.includes("all")) {
        // Everyone
        const users = await User.find(query).select("uid").lean();
        return users.map(u => u.uid);
    }

    if (groups.includes("jga_all")) orConditions.push({ role: "jga" });
    if (groups.includes("animator_all")) orConditions.push({ role: "animator" });
    if (groups.includes("volunteer_all")) orConditions.push({ role: "volunteer" });

    // Domain specific
    const domains = ["sports", "literary", "performing_creative_arts", "club", "miscellaneous"];
    for (const domain of domains) {
        if (groups.includes(`jga_${domain}`)) orConditions.push({ role: "jga", domain });
        if (groups.includes(`animator_${domain}`)) orConditions.push({ role: "animator", domain });
        if (groups.includes(`volunteer_${domain}`)) orConditions.push({ role: "volunteer", domain });
    }

    if (orConditions.length > 0) {
        query.$or = orConditions;
        const users = await User.find(query).select("uid").lean();
        return users.map(u => u.uid);
    }

    return [];
};


// ============================================================
// GET /api/meetings — List meetings for current user
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

        let query: any = {};

        // Admin sees all, standard users only see meetings they are invited to
        if (user.role !== "ga") {
            query.attendeeIds = decoded.uid;
        }

        const meetings = await Meeting.find(query)
            .populate("createdBy", "name role photoURL")
            .sort({ scheduledAt: 1 })
            .lean();

        return NextResponse.json({ success: true, data: meetings });
    } catch (error) {
        console.error("GET /api/meetings error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// POST /api/meetings — Create meeting (GA Only)
// ============================================================
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        const currentUser = await User.findOne({ uid: decoded.uid }).lean();
        if (!currentUser || currentUser.role !== "ga") {
            return NextResponse.json({ success: false, error: "Only GA can create meetings" }, { status: 403 });
        }

        const body = await req.json();
        const { title, agenda, scheduledAt, location, meetingLink, attendeeGroups = [], specificAttendeeIds = [] } = body;

        if (!title || !scheduledAt) {
            return NextResponse.json({ success: false, error: "Title and scheduled time are required" }, { status: 400 });
        }

        // Resolve attendee groups into actual UIDs
        const groupUids = await resolveAttendeeGroups(attendeeGroups);
        const finalAttendeeIds = Array.from(new Set([...groupUids, ...specificAttendeeIds]));

        const meeting = await Meeting.create({
            title,
            agenda,
            scheduledAt: new Date(scheduledAt),
            location,
            meetingLink,
            attendeeGroups,
            attendeeIds: finalAttendeeIds,
            createdBy: currentUser._id,
        });

        // ==========================================================
        // NOTIFICATIONS INTEGRATION
        // Notify all resolved attendees of the new meeting
        // ==========================================================
        const notifyIds = finalAttendeeIds.filter(uid => uid !== decoded.uid); // Exclude self
        if (notifyIds.length > 0) {
            const notifications = notifyIds.map(uid => ({
                userId: uid,
                type: "meeting",
                title: `📅 New Meeting: ${title}`,
                body: `Scheduled for ${new Date(scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}${location ? ` @ ${location}` : ''}`,
                link: `/meetings`,
            }));
            await Notification.insertMany(notifications).catch(err => console.error("Failed to insert meeting notifications", err));
        }

        return NextResponse.json({ success: true, data: meeting }, { status: 201 });
    } catch (error) {
        console.error("POST /api/meetings error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
