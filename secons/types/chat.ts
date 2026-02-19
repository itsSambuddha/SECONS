// Types — Chat & Messaging
// ============================================================

export type ChatThreadType =
    | "workspace"      // GA + JGA workspace
    | "domain"         // JGA + domain Animators
    | "event"          // GA + JGA + event Animators
    | "volunteer"      // Animator + assigned Volunteers
    | "custom";        // GA-created custom threads

export interface ChatThreadData {
    _id: string;
    type: ChatThreadType;
    name: string;
    participants: string[]; // User IDs
    eventId?: string;
    domain?: string;
    createdBy: string;
    createdAt: Date;
    lastMessageAt?: Date;
}

export interface MessageAttachment {
    url: string;
    type: "image" | "pdf" | "file";
    name: string;
    size: number;
}

export interface MessageData {
    _id: string;
    threadId: string;
    senderId: string;
    content: string;
    attachments: MessageAttachment[];
    readBy: string[]; // User IDs
    pinned: boolean;
    sentAt: Date;
}

// Notification types
export type NotificationType =
    | "announcement"
    | "meeting_scheduled"
    | "event_published"
    | "event_cancelled"
    | "score_update"
    | "points_awarded"
    | "expense_submitted"
    | "expense_approved"
    | "expense_rejected"
    | "chat_message"
    | "volunteer_assigned"
    | "system";

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export interface NotificationData {
    _id: string;
    userId: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    body: string;
    actionUrl?: string;
    read: boolean;
    createdAt: Date;
}
