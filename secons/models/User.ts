import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// User Model
// ============================================================

export interface IUser extends Document {
    uid: string; // Firebase UID
    name: string;
    email: string;
    role: "ga" | "jga" | "animator" | "volunteer" | "student";
    domain: string;
    phoneNumber?: string; // Encrypted
    whatsappNumber?: string; // Encrypted
    photoURL?: string;
    isActive: boolean;
    onboardingComplete: boolean;
    tourComplete: boolean;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        uid: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        role: {
            type: String,
            enum: ["ga", "jga", "animator", "volunteer", "student"],
            required: true,
            index: true,
        },
        domain: {
            type: String,
            enum: [
                "sports", "cultural", "literary", "security",
                "stage_technical", "media", "hospitality", "finance", "general",
            ],
            default: "general",
            index: true,
        },
        phoneNumber: { type: String }, // Stored encrypted
        whatsappNumber: { type: String }, // Stored encrypted
        photoURL: { type: String },
        isActive: { type: Boolean, default: true, index: true },
        onboardingComplete: { type: Boolean, default: false },
        tourComplete: { type: Boolean, default: false },
        lastActiveAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        collection: "users",
    }
);

// Compound indexes
userSchema.index({ role: 1, domain: 1 });
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
