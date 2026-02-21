import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { UserRole } from "@/types/auth";

// Helper to determine if a user matches the target demographics
const isUserTargeted = (
    userRole: UserRole,
    userDomain: string | undefined,
    targetRoles: string[],
    targetDomains: string[]
) => {
    // If targets are empty, it generally means "all"
    if (targetRoles.length === 0 && targetDomains.length === 0) return true;

    const roleMatch = targetRoles.length === 0 || targetRoles.includes(userRole);
    const domainMatch = targetDomains.length === 0 || (userDomain && targetDomains.includes(userDomain));

    // If both arrays have items, both must match (e.g., "animators" AND "sports").
    // If only one array has items, only that one needs to match.
    if (targetRoles.length > 0 && targetDomains.length > 0) return roleMatch && domainMatch;
    if (targetRoles.length > 0) return roleMatch;
    if (targetDomains.length > 0) return domainMatch;

    return false;
};

// ============================================================
// GET /api/announcements — List announcements visible to current user
// ============================================================
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        await connectDB();

        const currentUser = await User.findOne({ uid: decoded.uid }).lean();
        if (!currentUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        // Fetch all announcements and manually filter for role/domain logic
        // (A more complex MongoDB aggregation could do this natively, but filtering in TS is safer with this logic)
        const allAnnouncements = await Announcement.find()
            .populate("createdBy", "name role photoURL")
            .sort({ pinned: -1, createdAt: -1 })
            .lean();

        // Admin (GA) sees all. Others only see what targets them.
        const visibleAnnouncements = currentUser.role === "ga"
            ? allAnnouncements
            : allAnnouncements.filter((a) =>
                isUserTargeted(currentUser.role as UserRole, currentUser.domain, a.targetRoles, a.targetDomains) ||
                String(a.createdBy._id) === String(currentUser._id) // Or if they created it
            );

        // Map read state
        const enriched = visibleAnnouncements.map(a => ({
            ...a,
            isReadByMe: a.readBy?.includes(decoded.uid) || false,
        }));

        // Paginate manually after filtering
        const total = enriched.length;
        const paginated = enriched.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            success: true,
            data: {
                announcements: paginated,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("GET /api/announcements error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================
// POST /api/announcements — Create announcement
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
        if (!currentUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

        if (currentUser.role !== "ga" && currentUser.role !== "jga") {
            return NextResponse.json({ success: false, error: "Only GAs and JGAs can post announcements" }, { status: 403 });
        }

        const body = await req.json();
        const { title, content, targetRoles = [], targetDomains = [], pinned = false } = body;

        if (!title || !content) {
            return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
        }

        // JGA restrictions: can only post to their domain, and only to animators/volunteers
        let finalTargetRoles = targetRoles;
        let finalTargetDomains = targetDomains;

        if (currentUser.role === "jga") {
            finalTargetDomains = [currentUser.domain]; // Force to their domain
            // Strip out ga/jga from roles if they try to target upwards
            finalTargetRoles = targetRoles.filter((r: string) => r === "animator" || r === "volunteer");
            if (finalTargetRoles.length === 0) finalTargetRoles = ["animator", "volunteer"]; // Default if they messed up
        }

        const announcement = await Announcement.create({
            title,
            body: content,
            targetRoles: finalTargetRoles,
            targetDomains: finalTargetDomains,
            pinned: currentUser.role === "ga" ? pinned : false, // Only GA can pin
            createdBy: currentUser._id,
            readBy: [decoded.uid] // Creator has read it
        });

        // ==========================================================
        // NOTIFICATIONS INTEGRATION
        // Find users that matche the target demographics and notify them
        // ==========================================================
        let notificationQuery: any = { uid: { $ne: decoded.uid }, isActive: true };

        if (finalTargetRoles.length > 0 && finalTargetDomains.length > 0) {
            notificationQuery.$and = [
                { role: { $in: finalTargetRoles } },
                { domain: { $in: finalTargetDomains } }
            ];
        } else if (finalTargetRoles.length > 0) {
            notificationQuery.role = { $in: finalTargetRoles };
        } else if (finalTargetDomains.length > 0) {
            notificationQuery.domain = { $in: finalTargetDomains };
        }

        const targetUsers = await User.find(notificationQuery).select("uid").lean();

        if (targetUsers.length > 0) {
            const notifications = targetUsers.map((u) => ({
                userId: u.uid,
                type: "announcement",
                title: `📢 ${title}`,
                body: content.replace(/<[^>]*>?/gm, '').substring(0, 100), // Strip HTML and truncate
                link: `/announcements`,
            }));
            await Notification.insertMany(notifications).catch(err => console.error("Failed to push announcement notifications", err));
        }

        return NextResponse.json({ success: true, data: announcement }, { status: 201 });
    } catch (error) {
        console.error("POST /api/announcements error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
