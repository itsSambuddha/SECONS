import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Event Model
// ============================================================

export interface IEvent extends Document {
    title: string;
    category: "sports" | "literary" | "performing_creative_arts" | "club" | "miscellaneous";
    description: string;
    rules?: string;
    eligibility?: string;
    venue: string;
    startDateTime: Date;
    endDateTime: Date;
    flierUrl?: string;
    registrationLink?: string;
    status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
    cancellationReason?: string;
    animatorId: mongoose.Types.ObjectId;
    jgaDomain: string;
    participantCount?: number;
    averageRating?: number;
    createdAt: Date;
    updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
    {
        title: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ["sports", "literary", "performing_creative_arts", "club", "miscellaneous"],
            required: true,
            index: true,
        },
        description: { type: String, required: true },
        rules: { type: String },
        eligibility: { type: String },
        venue: { type: String, required: true, trim: true },
        startDateTime: { type: Date, required: true },
        endDateTime: { type: Date, required: true },
        flierUrl: { type: String },
        registrationLink: { type: String },
        status: {
            type: String,
            enum: ["draft", "published", "ongoing", "completed", "cancelled"],
            default: "draft",
            index: true,
        },
        cancellationReason: { type: String },
        animatorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        jgaDomain: { type: String, required: true, index: true },
        participantCount: { type: Number, default: 0 },
        averageRating: { type: Number },
    },
    {
        timestamps: true,
        collection: "events",
    }
);

// Compound indexes for common queries
eventSchema.index({ status: 1, startDateTime: 1 });
eventSchema.index({ jgaDomain: 1, status: 1 });
eventSchema.index({ category: 1, status: 1 });

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);
export default Event;
