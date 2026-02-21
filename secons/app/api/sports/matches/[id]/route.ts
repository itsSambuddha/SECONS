import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Match from "@/models/Match";
import User from "@/models/User";
import Notification from "@/models/Notification";
import Team from "@/models/Team";
import Fixture from "@/models/Fixture";
import Event from "@/models/Event";
import { withAuth } from "@/lib/withAuth";

/**
 * PATCH /api/sports/matches/[id] (Protected - GA/JGA)
 * Updates match scores, status, or players
 */
export const PATCH = withAuth(async (req, { params, user }) => {
    try {
        await connectDB();
        const body = await req.json();
        const { id } = await params;
        console.log("MATCH_PATCH_BODY:", { id, ...body });

        const currentMatch = await Match.findById(id);
        if (!currentMatch) {
            return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
        }

        // Lock completed matches: Block score/status updates if already completed
        const isScoreUpdate = body.scoreTeam1 !== undefined || body.scoreTeam2 !== undefined || body.cricketData !== undefined;
        if (currentMatch.status === "completed" && isScoreUpdate) {
            return NextResponse.json({
                success: false,
                error: "Match is finalized. Scores cannot be modified."
            }, { status: 400 });
        }

        // Prepare update object
        const updateData: any = { ...body };
        // BSON Sanitization: convert empty string to null to prevent CastError
        if (body.winner === "" || body.winner === "draw") {
            updateData.winner = null;
        }

        // Add to audit trail if scores changed
        if (body.scoreTeam1 !== undefined || body.scoreTeam2 !== undefined) {
            updateData.$push = {
                auditTrail: {
                    enteredBy: user.uid,
                    scoreTeam1: body.scoreTeam1 ?? currentMatch.scoreTeam1,
                    scoreTeam2: body.scoreTeam2 ?? currentMatch.scoreTeam2,
                    reason: body.note || "Score Update",
                    enteredAt: new Date()
                }
            };
        }

        // Automated Scoring Logic: Award points on completion
        if (body.status === "completed" && !currentMatch.pointsAwarded) {
            let eventId = currentMatch.sportEventId;

            if (!eventId) {
                const fixture = await Fixture.findById(currentMatch.fixtureId);
                eventId = fixture?.sportEventId;
            }

            if (eventId) {
                const s1 = body.scoreTeam1 ?? currentMatch.scoreTeam1;
                const s2 = body.scoreTeam2 ?? currentMatch.scoreTeam2;

                let winnerId = body.winner;
                if (!winnerId) {
                    winnerId = s1 > s2 ? currentMatch.team1Id : s1 < s2 ? currentMatch.team2Id : "draw";
                }

                const pointEntries = [];
                if (winnerId && winnerId !== "draw") {
                    // Win: 1 point (User requested 1 point for every win)
                    pointEntries.push({
                        teamId: winnerId,
                        points: 1,
                        position: 1
                    });
                } else if (winnerId === "draw") {
                    // Draw: 0 points (as per user's "1 point for a win" instruction)
                    // We can still record the entry but with 0 points if needed for history
                }

                for (const entry of pointEntries) {
                    await Team.findByIdAndUpdate(entry.teamId, {
                        $inc: { totalPoints: entry.points },
                        $push: {
                            eventPoints: {
                                eventId,
                                points: entry.points,
                                position: entry.position,
                                awardedAt: new Date(),
                                awardedBy: user.uid,
                                reason: `Won Sports Match (${currentMatch.sportName})`
                            }
                        }
                    });
                }
                updateData.pointsAwarded = true;
            }
        }

        const updatedMatch = await Match.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate("team1Id", "name").populate("team2Id", "name");

        if (!updatedMatch) {
            return NextResponse.json({ success: false, error: "Failed to update match" }, { status: 500 });
        }

        // Notify all users if score or status changed
        if (body.scoreTeam1 !== undefined || body.scoreTeam2 !== undefined || body.status) {
            // Also sync the parent Event status if Match status changed
            if (body.status && updatedMatch.sportEventId) {
                let eventStatus: string | undefined;
                if (body.status === "live") {
                    eventStatus = "ongoing";
                } else if (body.status === "completed") {
                    // Check if any other matches for this event are still live
                    const otherLiveMatches = await Match.findOne({
                        sportEventId: updatedMatch.sportEventId,
                        _id: { $ne: id },
                        status: "live"
                    });
                    if (!otherLiveMatches) eventStatus = "completed";
                } else if (body.status === "scheduled") {
                    eventStatus = "published";
                }

                if (eventStatus) {
                    await Event.findByIdAndUpdate(updatedMatch.sportEventId, { status: eventStatus });
                }
            }

            const allUsers = await User.find({ uid: { $ne: user.uid }, isActive: true }).select("uid").lean();
            if (allUsers.length > 0) {
                const team1Name = updatedMatch.team1Id && (updatedMatch.team1Id as any).name ? (updatedMatch.team1Id as any).name : "Team 1";
                const team2Name = updatedMatch.team2Id && (updatedMatch.team2Id as any).name ? (updatedMatch.team2Id as any).name : "Team 2";

                const notifications = allUsers.map(u => ({
                    userId: u.uid,
                    type: "system",
                    title: `Match Update: ${team1Name} vs ${team2Name}`,
                    body: body.status
                        ? `Match status changed to ${body.status}`
                        : `Score updated: ${updatedMatch.scoreTeam1} - ${updatedMatch.scoreTeam2}`,
                    link: `/sports`,
                }));
                await Notification.insertMany(notifications).catch(err => console.error("Failed to insert match notifications", err));
            }
        }

        return NextResponse.json({
            success: true,
            message: "Match updated successfully",
            data: updatedMatch,
        });
    } catch (error: any) {
        console.error("Match Update Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}, ["ga", "jga"]);

/**
 * DELETE /api/sports/matches/[id] (Protected - GA/JGA)
 * Removes a match from the database
 */
export const DELETE = withAuth(async (req, { params }) => {
    try {
        await connectDB();
        const { id } = await params;

        const deletedMatch = await Match.findByIdAndDelete(id);
        if (!deletedMatch) {
            return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Match deleted successfully"
        });
    } catch (error: any) {
        console.error("Match Deletion Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}, ["ga", "jga"]);

/**
 * GET /api/sports/matches/[id]
 * Retrieves single match details
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const match = await Match.findById(id)
            .populate("team1Id")
            .populate("team2Id")
            .populate("players.playerId")
            .populate("mvp");

        if (!match) {
            return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: match });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
