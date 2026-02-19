import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Team Model — 18 Competing Teams (3 semesters × 6 groups)
// ============================================================

export interface ITeamPointEntry {
    eventId: mongoose.Types.ObjectId;
    points: number;
    position: number;
    awardedAt: Date;
    awardedBy: string;
}

export interface ITeam extends Document {
    name: string;
    group: string;
    semester: number;
    totalPoints: number;
    eventPoints: ITeamPointEntry[];
    createdAt: Date;
}

const teamPointEntrySchema = new Schema<ITeamPointEntry>(
    {
        eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
        points: { type: Number, required: true },
        position: { type: Number, required: true },
        awardedAt: { type: Date, default: Date.now },
        awardedBy: { type: String, required: true },
    },
    { _id: false }
);

const teamSchema = new Schema<ITeam>(
    {
        name: { type: String, required: true, trim: true },
        group: {
            type: String,
            enum: ["Commerce", "Professional", "Life Science", "Physical Science", "Social Science", "Humanities"],
            required: true,
        },
        semester: { type: Number, enum: [2, 4, 6], required: true },
        totalPoints: { type: Number, default: 0, index: true },
        eventPoints: { type: [teamPointEntrySchema], default: [] },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "teams",
    }
);

// Compound indexes
teamSchema.index({ semester: 1, totalPoints: -1 });
teamSchema.index({ group: 1, semester: 1 }, { unique: true });

export const Team = mongoose.models.Team || mongoose.model<ITeam>("Team", teamSchema);
export default Team;
