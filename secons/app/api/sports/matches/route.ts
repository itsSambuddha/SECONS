import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Match from "@/models/Match";
import Team from "@/models/Team";
import User from "@/models/User";
import Event from "@/models/Event";
import { withAuth } from "@/lib/withAuth";
import { ApiResponse } from "@/types/api";

/**
 * GET /api/sports/matches
 * Retrieves matches with optional filtering by status (live, upcoming, finished)
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const sport = searchParams.get("sport");

        let query: any = {};
        if (status) query.status = status;
        if (sport) query.sportName = { $regex: sport, $options: "i" };

        // Find and populate team data and MVP
        const matches = await Match.find(query)
            .populate("team1Id", "name group semester")
            .populate("team2Id", "name group semester")
            .populate({
                path: "mvp",
                select: "name stats",
                populate: { path: "teamId", select: "name group semester" }
            })
            .sort({ updatedAt: -1 })
            .limit(20);

        return NextResponse.json({
            success: true,
            data: matches,
        });
    } catch (error: any) {
        console.error("Match Fetch Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/sports/matches (Protected - GA/JGA)
 * Creates a new match
 */
export const POST = withAuth(async (req, { user }) => {
    try {
        await connectDB();
        const body = await req.json();

        // Basic validation
        console.log("MATCH_POST_BODY:", JSON.stringify(body, null, 2));
        if (!body.team1Id || !body.team2Id || !body.sportName) {
            console.error("VALIDATION_FAILED:", { t1: !!body.team1Id, t2: !!body.team2Id, sn: !!body.sportName });
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Create or Link to Event automatically
        let sportEventId = body.sportEventId;
        if (!sportEventId) {
            // Find an event with the sport name as title
            let existingEvent = await Event.findOne({
                title: body.sportName,
                category: "Sports"
            });

            if (!existingEvent) {
                // Find the mongo user for animatorId
                const dbUser = await User.findOne({ uid: user.uid });

                // Create a default event for this sport
                existingEvent = await Event.create({
                    title: body.sportName,
                    category: "Sports",
                    description: `Automated scoring container for ${body.sportName} circuits.`,
                    venue: body.venue || "Main Grounds",
                    startDateTime: new Date(body.scheduledAt),
                    endDateTime: new Date(new Date(body.scheduledAt).getTime() + 2 * 60 * 60 * 1000), // +2h
                    registrationLink: "N/A",
                    status: "ongoing",
                    animatorId: dbUser?._id || user.uid,
                    jgaDomain: "sports"
                });
            }
            sportEventId = existingEvent._id;
        }

        // Sanitize IDs: convert empty strings to undefined
        const sanitizedData = { ...body, sportEventId };
        if (sanitizedData.fixtureId === "") delete sanitizedData.fixtureId;
        if (sanitizedData.winner === "" || sanitizedData.winner === "draw") sanitizedData.winner = null;

        const match = await Match.create({
            ...sanitizedData,
            auditTrail: [{
                enteredBy: user.uid,
                scoreTeam1: body.scoreTeam1 || 0,
                scoreTeam2: body.scoreTeam2 || 0,
                reason: "Match Initialized"
            }]
        });

        return NextResponse.json({
            success: true,
            message: "Match created successfully",
            data: match,
        });
    } catch (error: any) {
        console.error("Match Create Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}, ["ga", "jga"]);

/**
 * PATCH /api/sports/matches/[id] (Protected - GA/JGA)
 * Updates scores/status
 */
// This would typically go in [id]/route.ts, but for simplicity we can handle bulk updates here too or create a separate route.
