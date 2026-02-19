import connectDB from "@/lib/db";
import mongoose, { Schema, type Document } from "mongoose";

// ============================================================
// Audit Logger
// Writes structured audit entries to AuditLogs collection
// ============================================================

export type AuditEventType =
    | "USER_CREATED"
    | "USER_UPDATED"
    | "USER_DEACTIVATED"
    | "ROLE_CHANGED"
    | "EVENT_CREATED"
    | "EVENT_UPDATED"
    | "EVENT_PUBLISHED"
    | "EVENT_CANCELLED"
    | "EVENT_COMPLETED"
    | "FIXTURE_GENERATED"
    | "SCORE_ENTERED"
    | "SCORE_UPDATED"
    | "POINTS_AWARDED"
    | "BUDGET_ALLOCATED"
    | "EXPENSE_SUBMITTED"
    | "EXPENSE_APPROVED"
    | "EXPENSE_REJECTED"
    | "MEETING_SCHEDULED"
    | "ANNOUNCEMENT_CREATED"
    | "INVITATION_SENT"
    | "INVITATION_ACCEPTED"
    | "YEAR_RESET_INITIATED"
    | "YEAR_RESET_COMPLETE"
    | "RATE_LIMIT_BAN"
    | "AUTH_FAILURE"
    | "SYSTEM";

export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AuditEntry {
    eventType: AuditEventType;
    severity: AuditSeverity;
    userId?: string;
    userName?: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

// Schema (inline — also defined in models/AuditLog.ts for full model)
const auditLogSchema = new Schema(
    {
        eventType: { type: String, required: true, index: true },
        severity: { type: String, enum: ["INFO", "WARNING", "CRITICAL"], required: true, index: true },
        userId: { type: String, index: true },
        userName: { type: String },
        details: { type: Schema.Types.Mixed, default: {} },
        ipAddress: { type: String },
        userAgent: { type: String },
        createdAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: false,
        collection: "auditlogs",
    }
);

// TTL index: auto-delete after 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLogModel =
    mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
    try {
        await connectDB();
        await AuditLogModel.create({
            ...entry,
            createdAt: new Date(),
        });
    } catch (error) {
        // Audit logging should never crash the app
        console.error("Audit log write failed:", error);
    }
}

// Convenience functions
export async function logInfo(eventType: AuditEventType, userId: string, details: Record<string, unknown>) {
    return logAuditEvent({ eventType, severity: "INFO", userId, details });
}

export async function logWarning(eventType: AuditEventType, userId: string, details: Record<string, unknown>) {
    return logAuditEvent({ eventType, severity: "WARNING", userId, details });
}

export async function logCritical(eventType: AuditEventType, userId: string, details: Record<string, unknown>) {
    return logAuditEvent({ eventType, severity: "CRITICAL", userId, details });
}
