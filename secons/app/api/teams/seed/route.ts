import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { withGAAuth } from "@/lib/withAuth";
import type { ApiResponse } from "@/types/api";

const GROUP_CODES: Record<string, string> = {
    "Commerce": "COM",
    "Professional": "PROF",
    "Life Science": "LIFE",
    "Physical Science": "PHYS",
    "Social Science": "SOC",
    "Humanities": "HUM"
};

const GROUPS = ["Commerce", "Professional", "Life Science", "Physical Science", "Social Science", "Humanities"];
const SEMESTERS = [2, 4, 6];

/**
 * GET: Fetch all teams
 */
export async function GET() {
    try {
        await connectDB();
        const teams = await Team.find().sort({ semester: 1, group: 1 });
        return NextResponse.json({ success: true, data: teams });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * POST: Seed the 18 default teams (GA ONLY)
 * - Uses short codes (e.g. PROF2, COM4)
 */
const seedHandler = async () => {
    try {
        await connectDB();

        // Prepare 18 teams
        const teamsToUpsert = [];
        for (const sem of SEMESTERS) {
            for (const group of GROUPS) {
                const code = GROUP_CODES[group] || group.substring(0, 3).toUpperCase();
                teamsToUpsert.push({
                    name: `${code}${sem}`, // e.g. COM2, PROF4
                    group: group,
                    semester: sem,
                    totalPoints: 0,
                });
            }
        }

        // Use bulkWrite to upsert based on group and semester
        const operations = teamsToUpsert.map(team => ({
            updateOne: {
                filter: { group: team.group, semester: team.semester },
                update: { $set: { name: team.name, totalPoints: 0 } },
                upsert: true,
            }
        }));

        await Team.bulkWrite(operations);
        const finalTeams = await Team.find().sort({ semester: 1, group: 1 });

        return NextResponse.json({
            success: true,
            message: `Successfully synchronized ${finalTeams.length} teams`,
            data: finalTeams,
        });
    } catch (error: any) {
        console.error("Team Seeding Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
};

export const POST = withGAAuth(seedHandler);
