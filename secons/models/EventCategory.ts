import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Event Category Model — Dynamic categories for events
// ============================================================

export interface IEventCategory extends Document {
    name: string;
    slug: string;
    isDefault: boolean;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const eventCategorySchema = new Schema<IEventCategory>(
    {
        name: { type: String, required: true, trim: true, unique: true },
        slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
        isDefault: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    {
        timestamps: true,
        collection: "event_categories",
    }
);

export const EventCategory =
    mongoose.models.EventCategory || mongoose.model<IEventCategory>("EventCategory", eventCategorySchema);
export default EventCategory;
