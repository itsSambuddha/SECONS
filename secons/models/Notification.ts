import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    userId: string; // The user receiving the notification (Firebase UID)
    type: "chat" | "announcement" | "meeting" | "system";
    title: string;
    body: string;
    link?: string; // e.g., /chat?thread=123
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: { type: String, required: true, index: true },
        type: {
            type: String,
            enum: ["chat", "announcement", "meeting", "system"],
            required: true,
        },
        title: { type: String, required: true },
        body: { type: String, required: true },
        link: { type: String },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL Index: Auto-delete notifications 24 hours (86400 seconds) after creation
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Compound index for querying a user's unread/all notifications quickly
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", notificationSchema);
