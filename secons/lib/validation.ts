import { z } from "zod";

// ============================================================
// Zod Validation Schemas
// Shared across all API routes
// ============================================================

// ---------- Auth & Users ----------
export const inviteUserSchema = z.object({
    email: z.string().email("Valid email required"),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    role: z.enum(["jga", "animator", "volunteer", "student"]),
    domain: z.enum([
        "sports", "cultural", "literary", "security",
        "stage_technical", "media", "hospitality", "finance", "general",
    ]).optional().default("general"),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const acceptInviteSchema = z.object({
    token: z.string().min(1),
    name: z.string().min(2).max(100),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Valid phone number required").optional(),
    whatsapp: z.string().regex(/^\+?[\d\s-]{10,15}$/, "Valid WhatsApp number required").optional(),
});

// ---------- Events ----------
export const createEventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    category: z.enum(["sports", "literary", "performing_creative_arts", "club", "miscellaneous"]),
    description: z.string().min(10, "Description must be at least 10 characters").max(5000),
    rules: z.string().max(5000).optional(),
    eligibility: z.string().max(1000).optional(),
    venue: z.string().min(2, "Venue required").max(200),
    startDateTime: z.string().datetime("Valid ISO date required"),
    endDateTime: z.string().datetime("Valid ISO date required"),
    flierUrl: z.string().url().optional(),
    registrationLink: z.string().url("Must be a valid Google Form URL").optional(),
    status: z.enum(["draft", "published"]).optional().default("draft"),
});

export const updateEventSchema = createEventSchema.partial().extend({
    status: z.enum(["draft", "published", "ongoing", "completed", "cancelled"]).optional(),
    cancellationReason: z.string().max(500).optional(),
});

// ---------- Sports ----------
export const generateFixtureSchema = z.object({
    sportEventId: z.string().min(1),
    format: z.enum(["pool_knockout", "round_robin", "knockout", "custom"]),
    poolCount: z.number().min(2).max(6).optional().default(3),
    advancePerPool: z.number().min(1).max(4).optional().default(2),
});

export const updateScoreSchema = z.object({
    scoreTeam1: z.number().min(0),
    scoreTeam2: z.number().min(0),
    reason: z.string().max(200).optional(),
});

// ---------- Points ----------
export const awardPointsSchema = z.object({
    eventId: z.string().min(1),
    teamId: z.string().min(1),
    position: z.number().min(1).max(10),
    customPoints: z.number().min(0).max(100).optional(),
});

// ---------- Finance ----------
export const submitExpenseSchema = z.object({
    domain: z.string().min(1),
    eventId: z.string().optional(),
    amount: z.number().positive("Amount must be positive"),
    description: z.string().min(5, "Description required").max(500),
    category: z.enum([
        "venue", "equipment", "printing", "food_beverages",
        "decorations", "transport", "prizes", "miscellaneous",
    ]),
    receiptUrl: z.string().url().optional(),
});

export const allocateBudgetSchema = z.object({
    domain: z.string().min(1),
    eventId: z.string().optional(),
    amount: z.number().positive("Amount must be positive"),
    description: z.string().max(500).optional(),
});

export const approveExpenseSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    note: z.string().max(500).optional(),
});

// ---------- Meetings ----------
export const scheduleMeetingSchema = z.object({
    title: z.string().min(3).max(200),
    agenda: z.string().max(2000).optional(),
    scheduledAt: z.string().datetime(),
    location: z.string().min(2).max(200),
    attendeeGroups: z.array(z.enum(["ga", "jga", "animator", "volunteer"])).min(1),
    attendeeIds: z.array(z.string()).optional(),
});

// ---------- Chat ----------
export const chatMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(5000),
    attachments: z.array(z.object({
        url: z.string().url(),
        type: z.enum(["image", "pdf", "file"]),
        name: z.string(),
        size: z.number().positive(),
    })).max(5).optional(),
});

// ---------- Announcements ----------
export const createAnnouncementSchema = z.object({
    title: z.string().min(3).max(200),
    body: z.string().min(5).max(5000),
    targetRoles: z.array(z.enum(["ga", "jga", "animator", "volunteer", "student"])).min(1),
    targetDomains: z.array(z.string()).optional(),
    pinned: z.boolean().optional().default(false),
});

// ---------- Feedback ----------
export const submitFeedbackSchema = z.object({
    eventId: z.string().min(1),
    rating: z.number().min(1).max(5),
    highlights: z.string().max(1000).optional(),
    suggestions: z.string().max(1000).optional(),
});

// ---------- Utility ----------
export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
