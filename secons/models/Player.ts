import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Player Model — Individual participant tracking
// ============================================================

export interface IPlayer extends Document {
    name: string;
    teamId: mongoose.Types.ObjectId;
    rollNumber?: string;
    photo?: string;
    stats: {
        points: number;
        mvps: number;
        matchesPlayed: number;
    };
    customStats: Map<string, number>; // Dynamic stats like "goals", "wickets", "time"
    createdAt: Date;
}

const playerSchema = new Schema<IPlayer>(
    {
        name: { type: String, required: true, trim: true },
        teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
        rollNumber: { type: String, trim: true },
        photo: { type: String },
        stats: {
            points: { type: Number, default: 0 },
            mvps: { type: Number, default: 0 },
            matchesPlayed: { type: Number, default: 0 },
        },
        customStats: { type: Map, of: Number, default: {} },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "players",
    }
);

// Compound index for fast team-based lookups
playerSchema.index({ teamId: 1, name: 1 });

export const Player = mongoose.models.Player || mongoose.model<IPlayer>("Player", playerSchema);
export default Player;
