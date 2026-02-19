import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Finance Model — Budgets & Expenses
// ============================================================

export interface IFinance extends Document {
    type: "budget_allocation" | "expense";
    domain: string;
    eventId?: mongoose.Types.ObjectId;
    amount: number;
    description: string;
    category: string;
    receiptUrl?: string;
    submittedBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    approvalNote?: string;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}

const financeSchema = new Schema<IFinance>(
    {
        type: {
            type: String,
            enum: ["budget_allocation", "expense"],
            required: true,
            index: true,
        },
        domain: { type: String, required: true, index: true },
        eventId: { type: Schema.Types.ObjectId, ref: "Event" },
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ["venue", "equipment", "printing", "food_beverages", "decorations", "transport", "prizes", "miscellaneous"],
            required: true,
        },
        receiptUrl: { type: String },
        submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
        approvalNote: { type: String },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "finance",
    }
);

financeSchema.index({ domain: 1, status: 1 });
financeSchema.index({ submittedBy: 1, type: 1 });

export const Finance = mongoose.models.Finance || mongoose.model<IFinance>("Finance", financeSchema);
export default Finance;
