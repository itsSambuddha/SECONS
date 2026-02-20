import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// AuditLog Model (Full model — extends audit-logger.ts inline)
// ============================================================

export interface IAuditLog extends Document {
    eventType: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    userId?: string;
    userName?: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        eventType: { type: String, required: true, index: true },
        severity: {
            type: String,
            enum: ["INFO", "WARNING", "CRITICAL"],
            required: true,
            index: true,
        },
        userId: { type: String, index: true },
        userName: { type: String },
        details: { type: Schema.Types.Mixed, default: {} },
        ipAddress: { type: String },
        userAgent: { type: String },
        createdAt: { type: Date, default: Date.now },
    },
    {
        timestamps: false,
        collection: "auditlogs",
    }
);

// TTL: auto-delete after 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
auditLogSchema.index({ eventType: 1, createdAt: -1 });

// Force model recompilation in dev to catch schema changes
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.AuditLog;
}

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
export default AuditLog;
