import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Message Model
// ============================================================

export interface IMessageAttachment {
    url: string;
    type: "image" | "pdf" | "file";
    name: string;
    size: number;
}

export interface IMessage extends Document {
    threadId: mongoose.Types.ObjectId;
    senderId: string;
    content: string;
    attachments: IMessageAttachment[];
    readBy: string[];
    pinned: boolean;
    sentAt: Date;
}

const attachmentSchema = new Schema<IMessageAttachment>(
    {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "pdf", "file"], required: true },
        name: { type: String, required: true },
        size: { type: Number, required: true },
    },
    { _id: false }
);

const messageSchema = new Schema<IMessage>(
    {
        threadId: { type: Schema.Types.ObjectId, ref: "ChatThread", required: true, index: true },
        senderId: { type: String, required: true, index: true },
        content: { type: String, required: true },
        attachments: { type: [attachmentSchema], default: [] },
        readBy: { type: [String], default: [] },
        pinned: { type: Boolean, default: false },
        sentAt: { type: Date, default: Date.now, index: true },
    },
    {
        collection: "messages",
    }
);

// Compound index for paginated message fetching
messageSchema.index({ threadId: 1, sentAt: -1 });

export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
export default Message;
