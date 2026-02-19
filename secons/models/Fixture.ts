import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Fixture Model — Sports fixture brackets
// ============================================================

export interface IPoolMatch {
    matchId: mongoose.Types.ObjectId;
}

export interface IPool {
    name: string;
    teams: mongoose.Types.ObjectId[];
    matches: mongoose.Types.ObjectId[];
}

export interface IKnockoutRound {
    name: string;
    matches: mongoose.Types.ObjectId[];
}

export interface IFixture extends Document {
    sportEventId: mongoose.Types.ObjectId;
    format: "pool_knockout" | "round_robin" | "knockout" | "custom";
    pools: IPool[];
    knockoutRounds: IKnockoutRound[];
    status: "draft" | "active" | "completed";
    createdBy: string;
    createdAt: Date;
}

const poolSchema = new Schema<IPool>(
    {
        name: { type: String, required: true },
        teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
        matches: [{ type: Schema.Types.ObjectId, ref: "Match" }],
    },
    { _id: false }
);

const knockoutRoundSchema = new Schema<IKnockoutRound>(
    {
        name: { type: String, required: true },
        matches: [{ type: Schema.Types.ObjectId, ref: "Match" }],
    },
    { _id: false }
);

const fixtureSchema = new Schema<IFixture>(
    {
        sportEventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
        format: {
            type: String,
            enum: ["pool_knockout", "round_robin", "knockout", "custom"],
            required: true,
        },
        pools: { type: [poolSchema], default: [] },
        knockoutRounds: { type: [knockoutRoundSchema], default: [] },
        status: {
            type: String,
            enum: ["draft", "active", "completed"],
            default: "draft",
        },
        createdBy: { type: String, required: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "fixtures",
    }
);

export const Fixture = mongoose.models.Fixture || mongoose.model<IFixture>("Fixture", fixtureSchema);
export default Fixture;
