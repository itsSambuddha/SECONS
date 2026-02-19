// Types — Events
// ============================================================

export type EventCategory =
    | "sports"
    | "literary"
    | "performing_creative_arts"
    | "club"
    | "miscellaneous";

export type EventStatus =
    | "draft"
    | "published"
    | "ongoing"
    | "completed"
    | "cancelled";

export interface EventData {
    _id: string;
    title: string;
    category: EventCategory;
    description: string;
    rules?: string;
    eligibility?: string;
    venue: string;
    startDateTime: Date;
    endDateTime: Date;
    flierUrl?: string;
    registrationLink?: string;
    status: EventStatus;
    animatorId: string;
    jgaDomain: string;
    createdAt: Date;
    updatedAt: Date;
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
    sports: "Sports",
    literary: "Literary",
    performing_creative_arts: "Performing & Creative Arts",
    club: "Club Events",
    miscellaneous: "Miscellaneous",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
    draft: "Draft",
    published: "Published",
    ongoing: "Ongoing",
    completed: "Completed",
    cancelled: "Cancelled",
};

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
    sports: "#2563EB",
    literary: "#16A34A",
    performing_creative_arts: "#F97316",
    club: "#8B5CF6",
    miscellaneous: "#6B7280",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
    draft: "#6B7280",
    published: "#2563EB",
    ongoing: "#16A34A",
    completed: "#1A1A2E",
    cancelled: "#DC2626",
};
