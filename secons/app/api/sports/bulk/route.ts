import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Player from "@/models/Player";
import Match from "@/models/Match";
import Fixture from "@/models/Fixture";
import { withAdminAuth } from "@/lib/withAuth";
import type { ApiResponse } from "@/types/api";
import mongoose from "mongoose";

/**
 * POST: Bulk data importer (Admin only)
 * Handles players, fixtures, and matches in a single high-speed endpoint.
 */
const bulkImportHandler = async (req: Request) => {
    try {
        const body = await req.json();
        const { players, fixtures, matches, eventId } = body;

        await connectDB();

        const results: any = { players: 0, fixtures: 0, matches: 0, errors: [] };

        // 1. Resolve Teams (Map names to IDs for reference)
        const allTeams = await Team.find();
        const teamNameMap = new Map(allTeams.map(t => [t.name.toLowerCase().trim(), t._id]));

        // 2. Process Players
        if (players && Array.isArray(players)) {
            const playersToInsert = players.map((p: any) => {
                const teamId = teamNameMap.get(p.teamName?.toLowerCase().trim());
                if (!teamId) return null;
                return {
                    name: p.name,
                    teamId,
                    rollNumber: p.rollNumber,
                    stats: { points: 0, mvps: 0, matchesPlayed: 0 }
                };
            }).filter(Boolean);

            if (playersToInsert.length > 0) {
                const batch = await Player.insertMany(playersToInsert, { ordered: false });
                results.players = batch.length;
            }
        }

        // 3. Process Fixtures
        let primaryFixtureId: mongoose.Types.ObjectId | null = null;
        if (fixtures && Array.isArray(fixtures)) {
            const fixturesToInsert = fixtures.map((f: any) => ({
                sportEventId: f.sportEventId || eventId,
                format: f.format || "knockout",
                status: "active",
                createdBy: "SYSTEM_BULK"
            }));

            const createdFixtures = await Fixture.insertMany(fixturesToInsert);
            results.fixtures = createdFixtures.length;
            if (createdFixtures.length > 0) primaryFixtureId = createdFixtures[0]._id;
        }

        // 4. Process Matches
        if (matches && Array.isArray(matches)) {
            // If no fixture was created, create a default one for these matches
            if (!primaryFixtureId && eventId) {
                const defFixture = await Fixture.create({
                    sportEventId: eventId,
                    format: "custom",
                    status: "active",
                    createdBy: "SYSTEM_BULK"
                });
                primaryFixtureId = defFixture._id;
            }

            const matchesToInsert = matches.map((m: any) => {
                const team1Id = teamNameMap.get(m.team1Name?.toLowerCase().trim());
                const team2Id = teamNameMap.get(m.team2Name?.toLowerCase().trim());

                if (!team1Id || !team2Id || !primaryFixtureId) {
                    results.errors.push(`Could not resolve teams for match: ${m.team1Name} vs ${m.team2Name}`);
                    return null;
                }

                return {
                    fixtureId: primaryFixtureId,
                    team1Id,
                    team2Id,
                    scoreTeam1: m.scoreTeam1 || 0,
                    scoreTeam2: m.scoreTeam2 || 0,
                    status: m.status || "scheduled",
                    sportName: m.sportName || "Sports Activity",
                    venue: m.venue || "TBD",
                    scheduledAt: m.scheduledAt ? new Date(m.scheduledAt) : new Date(),
                    roundName: m.roundName,
                    format: m.format || "standard"
                };
            }).filter(Boolean);

            if (matchesToInsert.length > 0) {
                const batch = await Match.insertMany(matchesToInsert);
                results.matches = batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            data: results
        });

    } catch (error: any) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
};

export const POST = withAdminAuth(bulkImportHandler);
