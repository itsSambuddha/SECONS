import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// InvitationToken Model
// ============================================================

export interface IInvitationToken extends Document {
    token: string; // 6-character alphanumeric code
    email: string;
    name: string;
    role: "jga" | "animator" | "volunteer" | "student";
    domain: string;
    invitedBy: string; // User ID of inviter
    used: boolean;
    expiresAt: Date;
    createdAt: Date;
}

const invitationTokenSchema = new Schema<IInvitationToken>(
    {
        token: { type: String, required: true, unique: true, uppercase: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        role: {
            type: String,
            enum: ["jga", "animator", "volunteer", "student"],
            required: true,
        },
        domain: { type: String, default: "general" },
        invitedBy: { type: String, required: true },
        used: { type: Boolean, default: false },
        expiresAt: { type: Date, required: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: "invitation_tokens",
    }
);

// TTL index: auto-delete after expiry + 24h grace period
invitationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });
invitationTokenSchema.index({ email: 1, used: 1 });
invitationTokenSchema.index({ token: 1 });

export const InvitationToken =
    mongoose.models.InvitationToken ||
    mongoose.model<IInvitationToken>("InvitationToken", invitationTokenSchema);
export default InvitationToken;
