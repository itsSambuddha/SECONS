// Types — User Roles & Auth
// ============================================================

export type UserRole = "ga" | "jga" | "animator" | "volunteer" | "student";

export type UserDomain =
    | "sports"
    | "cultural"
    | "literary"
    | "security"
    | "stage_technical"
    | "media"
    | "hospitality"
    | "finance"
    | "general";

export interface SessionUser {
    _id: string;
    uid: string; // Firebase UID
    name: string;
    email: string;
    role: UserRole;
    domain: UserDomain;
    photoURL?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    isActive: boolean;
    onboardingComplete: boolean;
    tourComplete: boolean;
}

export interface DecodedToken {
    uid: string;
    email: string;
    role: UserRole;
    domain: UserDomain;
}

// Role hierarchy (lower number = higher authority)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    ga: 1,
    jga: 2,
    animator: 3,
    volunteer: 4,
    student: 5,
};

// Check if a role has authority over another
export function hasAuthority(actorRole: UserRole, targetRole: UserRole): boolean {
    return ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY[targetRole];
}
