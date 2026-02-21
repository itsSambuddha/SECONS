import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

/**
 * GET /api/sports/leaderboard
 * Fetches the top teams sorted by totalPoints.
 */
export async function GET() {
    try {
        await connectDB();

        // Fetch teams sorted by points DESC, then semester ASC
        const teams = await Team.find()
            .sort({ totalPoints: -1, semester: 1 })
            .limit(10);

        return NextResponse.json({
            success: true,
            data: teams
        });
    } catch (error: any) {
        console.error("Leaderboard Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
