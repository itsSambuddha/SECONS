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

export interface IMatch extends Document {
    fixtureId: mongoose.Types.ObjectId;
    team1Id: mongoose.Types.ObjectId;
    team2Id: mongoose.Types.ObjectId;
    scoreTeam1: number;
    scoreTeam2: number;
    winner?: mongoose.Types.ObjectId;
    status: "scheduled" | "live" | "completed" | "cancelled";
    scheduledAt: Date;
    venue: string;
    roundName?: string; // "Pool A", "Semi Final 1", "Final"
    enteredBy?: string;
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
        fixtureId: { type: Schema.Types.ObjectId, ref: "Fixture", required: true, index: true },
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
        scheduledAt: { type: Date, required: true },
        venue: { type: String, required: true },
        roundName: { type: String },
        enteredBy: { type: String },
        auditTrail: { type: [scoreAuditSchema], default: [] },
    },
    {
        timestamps: { createdAt: false, updatedAt: true },
        collection: "matches",
    }
);

matchSchema.index({ fixtureId: 1, status: 1 });

export const Match = mongoose.models.Match || mongoose.model<IMatch>("Match", matchSchema);
export default Match;
