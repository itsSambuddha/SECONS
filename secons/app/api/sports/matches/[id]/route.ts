import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Match from "@/models/Match";
import User from "@/models/User";
import Notification from "@/models/Notification";
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

        // Prepare update object
        const updateData: any = { ...body };

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

        const updatedMatch = await Match.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate("team1Id", "name").populate("team2Id", "name");

        // Notify all users if score or status changed
        if (body.scoreTeam1 !== undefined || body.scoreTeam2 !== undefined || body.status) {
            const allUsers = await User.find({ uid: { $ne: user.uid }, isActive: true }).select("uid").lean();
            if (allUsers.length > 0) {
                // @ts-ignore
                const team1Name = updatedMatch?.team1Id?.name || "Team 1";
                // @ts-ignore
                const team2Name = updatedMatch?.team2Id?.name || "Team 2";

                const notifications = allUsers.map(u => ({
                    userId: u.uid,
                    type: "system",
                    title: `Match Update: ${team1Name} vs ${team2Name}`,
                    body: body.status
                        ? `Match status changed to ${body.status}`
                        : `Score updated: ${updatedMatch?.scoreTeam1} - ${updatedMatch?.scoreTeam2}`,
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
