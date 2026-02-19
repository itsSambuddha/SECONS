"use client";

import { useAuth } from "@/hooks/useAuth";
import { ROLE_HIERARCHY, hasAuthority, type UserRole } from "@/types/auth";

/**
 * useRole — role-aware utilities for the current user.
 */
export function useRole() {
    const { user } = useAuth();

    const role = user?.role ?? null;

    return {
        /** Current user's role */
        role,
        /** Role hierarchy level (1 = highest) */
        level: role ? ROLE_HIERARCHY[role] : null,

        // Convenience booleans
        isGA: role === "ga",
        isJGA: role === "jga",
        isAnimator: role === "animator",
        isVolunteer: role === "volunteer",
        isStudent: role === "student",

        // Role group checks
        isAdmin: role === "ga" || role === "jga",
        isManager: role === "ga" || role === "jga" || role === "animator",

        /** Check if current user has authority over a target role */
        hasAuthorityOver: (targetRole: UserRole): boolean => {
            if (!role) return false;
            return hasAuthority(role, targetRole);
        },

        /** Check if current user's role is in the allowed list */
        hasRole: (...allowed: UserRole[]): boolean => {
            if (!role) return false;
            return allowed.includes(role);
        },

        /** Current user's domain */
        domain: user?.domain ?? null,
    };
}
