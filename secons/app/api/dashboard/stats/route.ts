import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import Match from "@/models/Match";
import Announcement from "@/models/Announcement";
import Finance from "@/models/Finance";
import User from "@/models/User";
import { withAuth } from "@/lib/withAuth";

// ============================================================
// GET /api/dashboard/stats — High-fidelity analytics
// ============================================================
export const GET = withAuth(async (req, { user }) => {
    try {
        await connectDB();

        // 1. Core Counts
        const totalEvents = await Event.countDocuments();
        const activeMatches = await Match.countDocuments({ status: "live" });
        const totalUsers = await User.countDocuments();

        // 2. Announcements (Latest 3)
        const recentAnnouncements = await Announcement.find()
            .sort({ pinned: -1, createdAt: -1 })
            .limit(3)
            .populate("createdBy", "name role photoURL")
            .lean();

        // 3. Finance (For GAs/JGAs)
        let financeStats = null;
        if (user.role === "ga" || user.role === "jga") {
            const query = user.role === "jga" ? { domain: user.domain } : {};
            const stats = await Finance.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: "$type",
                        total: { $sum: "$amount" }
                    }
                }
            ]);
            const budget = stats.find(s => s._id === "budget_allocation")?.total || 0;
            const spent = stats.find(s => s._id === "expense")?.total || 0;
            financeStats = { budget, spent, remaining: budget - spent };
        }

        // 4. Matches Overview (Latest 5)
        const recentMatches = await Match.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("team1Id team2Id", "name")
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                counts: { totalEvents, activeMatches, totalUsers },
                announcements: recentAnnouncements,
                finance: financeStats,
                matches: recentMatches,
                user: {
                    role: user.role,
                    domain: user.domain
                }
            }
        });
    } catch (error) {
        console.error("GET /api/dashboard/stats error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}, ["ga", "jga", "animator", "volunteer", "student"]);
