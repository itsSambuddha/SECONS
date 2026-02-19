import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Feedback Model — Post-event student feedback
// ============================================================

export interface IFeedback extends Document {
    eventId: mongoose.Types.ObjectId;
    userId: string;
    rating: number; // 1-5
    highlights?: string;
    suggestions?: string;
    createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
    {
        eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
        userId: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        highlights: { type: String },
        suggestions: { type: String },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "feedback",
    }
);

feedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true }); // One feedback per user per event

export const Feedback = mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", feedbackSchema);
export default Feedback;
