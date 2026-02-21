import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Meeting Model
// ============================================================

export interface IMeeting extends Document {
    title: string;
    agenda?: string;
    scheduledAt: Date;
    location: string;
    meetingLink?: string;
    attendeeGroups: string[];
    attendeeIds: string[];
    notificationSent: boolean;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
    {
        title: { type: String, required: true, trim: true },
        agenda: { type: String },
        scheduledAt: { type: Date, required: true, index: true },
        location: { type: String, required: true },
        meetingLink: { type: String },
        attendeeGroups: { type: [String], required: true },
        attendeeIds: { type: [String], default: [] },
        notificationSent: { type: Boolean, default: false },
        notes: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "meetings",
    }
);

meetingSchema.index({ scheduledAt: 1 });

export const Meeting = mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", meetingSchema);
export default Meeting;
