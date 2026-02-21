import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Match Model — Individual match within a fixture
// ============================================================

export interface IScoreAuditEntry {
    scoreTeam1: number;
    scoreTeam2: number;
    enteredBy: string;
    enteredAt: Date;
    reason?: string;
}

export interface ICricketData {
    innings: 1 | 2;
    team1: { runs: number; wickets: number; overs: number; balls: number };
    team2: { runs: number; wickets: number; overs: number; balls: number };
    target?: number;
    batting: {
        striker: { name: string; runs: number; balls: number };
        nonStriker: { name: string; runs: number; balls: number };
    };
    bowling: {
        name: string;
        wickets: number;
        runs: number;
        overs: number;
        balls: number;
    };
    thisOver: string[];
}

export interface IMatch extends Document {
    fixtureId: mongoose.Types.ObjectId;
    team1Id: mongoose.Types.ObjectId;
    team2Id: mongoose.Types.ObjectId;
    scoreTeam1: number;
    scoreTeam2: number;
    winner?: mongoose.Types.ObjectId;
    status: "scheduled" | "live" | "completed" | "cancelled";
    format: "standard" | "heats" | "timed"; // Support for different scoring logics
    players: {
        playerId: mongoose.Types.ObjectId;
        points: number;
        role?: string;
    }[];
    mvp?: mongoose.Types.ObjectId;
    scheduledAt: Date;
    sportName: string;
    venue: string;
    roundName?: string; // "Pool A", "Semi Final 1", "Final"
    enteredBy?: string;
    cricketData?: ICricketData;
    auditTrail: IScoreAuditEntry[];
    updatedAt: Date;
}

const scoreAuditSchema = new Schema<IScoreAuditEntry>(
    {
        scoreTeam1: { type: Number, required: true },
        scoreTeam2: { type: Number, required: true },
        enteredBy: { type: String, required: true },
        enteredAt: { type: Date, default: Date.now },
        reason: { type: String },
    },
    { _id: false }
);

const matchSchema = new Schema<IMatch>(
    {
        fixtureId: { type: Schema.Types.ObjectId, ref: "Fixture", index: true },
        team1Id: { type: Schema.Types.ObjectId, ref: "Team", required: true },
        team2Id: { type: Schema.Types.ObjectId, ref: "Team", required: true },
        scoreTeam1: { type: Number, default: 0 },
        scoreTeam2: { type: Number, default: 0 },
        winner: { type: Schema.Types.ObjectId, ref: "Team" },
        status: {
            type: String,
            enum: ["scheduled", "live", "completed", "cancelled"],
            default: "scheduled",
            index: true,
        },
        format: {
            type: String,
            enum: ["standard", "heats", "timed"],
            default: "standard",
        },
        players: [{
            playerId: { type: Schema.Types.ObjectId, ref: "Player" },
            points: { type: Number, default: 0 },
            role: { type: String },
        }],
        mvp: { type: Schema.Types.ObjectId, ref: "Player" },
        scheduledAt: { type: Date, required: true },
        sportName: { type: String, required: true, index: true },
        venue: { type: String, required: true },
        roundName: { type: String },
        enteredBy: { type: String },
        cricketData: {
            innings: { type: Number, enum: [1, 2], default: 1 },
            team1: {
                runs: { type: Number, default: 0 },
                wickets: { type: Number, default: 0 },
                overs: { type: Number, default: 0 },
                balls: { type: Number, default: 0 }
            },
            team2: {
                runs: { type: Number, default: 0 },
                wickets: { type: Number, default: 0 },
                overs: { type: Number, default: 0 },
                balls: { type: Number, default: 0 }
            },
            target: { type: Number },
            batting: {
                striker: {
                    name: { type: String, default: "Striker" },
                    runs: { type: Number, default: 0 },
                    balls: { type: Number, default: 0 }
                },
                nonStriker: {
                    name: { type: String, default: "Non-Striker" },
                    runs: { type: Number, default: 0 },
                    balls: { type: Number, default: 0 }
                }
            },
            bowling: {
                name: { type: String, default: "Bowler" },
                wickets: { type: Number, default: 0 },
                runs: { type: Number, default: 0 },
                overs: { type: Number, default: 0 },
                balls: { type: Number, default: 0 }
            },
            thisOver: { type: [String], default: [] },
            toss: {
                winner: { type: String },
                decision: { type: String, enum: ["bat", "bowl"] }
            }
        },
        auditTrail: { type: [scoreAuditSchema], default: [] },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
        collection: "matches",
    }
);

matchSchema.index({ fixtureId: 1, status: 1 });

// Ensure model is updated in development (Next.js HMR)
if (mongoose.models && mongoose.models.Match) {
    delete mongoose.models.Match;
}

export const Match = mongoose.model<IMatch>("Match", matchSchema);
export default Match;
