import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// ChatThread Model
// ============================================================

export interface IChatThread extends Document {
    type: "workspace" | "domain" | "event" | "volunteer" | "custom";
    name: string;
    description?: string;
    avatar?: string;
    participants: string[];
    eventId?: mongoose.Types.ObjectId;
    domain?: string;
    createdBy: string;
    isArchived: boolean;
    lastMessageAt?: Date;
    createdAt: Date;
}

const chatThreadSchema = new Schema<IChatThread>(
    {
        type: {
            type: String,
            enum: ["workspace", "domain", "event", "volunteer", "custom"],
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        avatar: { type: String },
        participants: { type: [String], required: true, index: true },
        eventId: { type: Schema.Types.ObjectId, ref: "Event" },
        domain: { type: String },
        createdBy: { type: String, required: true },
        isArchived: { type: Boolean, default: false },
        lastMessageAt: { type: Date },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "chat_threads",
    }
);

chatThreadSchema.index({ participants: 1, lastMessageAt: -1 });

export const ChatThread = mongoose.models.ChatThread || mongoose.model<IChatThread>("ChatThread", chatThreadSchema);
export default ChatThread;
