import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { withAuth } from "@/lib/withAuth";

/**
 * POST /api/teams/[id]/points (Protected - GA/JGA)
 * Manually award points to a team for an event.
 */
export const POST = withAuth(async (req, { params, user }) => {
    try {
        await connectDB();
        const { id } = await params;
        const { points, position, eventId, reason } = await req.json();

        if (points === undefined || position === undefined || !eventId) {
            return NextResponse.json({ success: false, error: "points, position, and eventId are required" }, { status: 400 });
        }

        const team = await Team.findByIdAndUpdate(
            id,
            {
                $inc: { totalPoints: points },
                $push: {
                    eventPoints: {
                        eventId,
                        points,
                        position,
                        reason,
                        awardedBy: user.uid,
                        awardedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!team) {
            return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Points awarded successfully",
            data: team
        });
    } catch (error: any) {
        console.error("Award Points Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}, ["ga", "jga"]);
