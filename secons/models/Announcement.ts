import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Announcement Model
// ============================================================

export interface IAnnouncement extends Document {
    title: string;
    body: string;
    targetRoles: string[];
    targetDomains: string[];
    createdBy: mongoose.Types.ObjectId;
    pinned: boolean;
    readBy: string[];
    createdAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
    {
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true },
        targetRoles: { type: [String], required: true },
        targetDomains: { type: [String], default: [] },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        pinned: { type: Boolean, default: false },
        readBy: { type: [String], default: [] },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "announcements",
    }
);

announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ pinned: -1, createdAt: -1 });

export const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncement>("Announcement", announcementSchema);
export default Announcement;
