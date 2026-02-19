// Types — Sports, Fixtures, Matches
// ============================================================

export type FixtureFormat = "pool_knockout" | "round_robin" | "knockout" | "custom";

export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled";

export type FixtureStatus = "draft" | "active" | "completed";

export interface PoolData {
    name: string;
    teams: string[]; // Team IDs
    matches: string[]; // Match IDs
}

export interface KnockoutRound {
    name: string; // "Quarter Finals", "Semi Finals", "Final"
    matches: string[]; // Match IDs
}

export interface FixtureData {
    _id: string;
    sportEventId: string;
    format: FixtureFormat;
    pools: PoolData[];
    knockoutRounds: KnockoutRound[];
    status: FixtureStatus;
    createdAt: Date;
}

export interface ScoreAuditEntry {
    scoreTeam1: number;
    scoreTeam2: number;
    enteredBy: string;
    enteredAt: Date;
    reason?: string;
}

export interface MatchData {
    _id: string;
    fixtureId: string;
    team1Id: string;
    team2Id: string;
    scoreTeam1: number;
    scoreTeam2: number;
    winner?: string;
    status: MatchStatus;
    scheduledAt: Date;
    venue: string;
    enteredBy?: string;
    auditTrail: ScoreAuditEntry[];
    updatedAt: Date;
}

export interface TeamPointEntry {
    eventId: string;
    points: number;
    position: number;
    awardedAt: Date;
    awardedBy: string;
}

export interface TeamData {
    _id: string;
    name: string;
    group: string;
    semester: number;
    totalPoints: number;
    eventPoints: TeamPointEntry[];
    createdAt: Date;
}

export const FIXTURE_FORMAT_LABELS: Record<FixtureFormat, string> = {
    pool_knockout: "Pool Stage + Knockout",
    round_robin: "Round Robin (Full)",
    knockout: "Knockout Only",
    custom: "Custom",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
    scheduled: "Scheduled",
    live: "Live",
    completed: "Completed",
    cancelled: "Cancelled",
};

// Default points scale
export const DEFAULT_POINTS: Record<number, number> = {
    1: 5,  // 1st place
    2: 3,  // 2nd place
    3: 1,  // 3rd place
};

export const PARTICIPATION_POINTS = 0.5;
