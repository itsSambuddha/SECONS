"use client";

import { useAuthContext } from "@/components/providers/AuthProvider";

/**
 * useAuth — primary auth hook for components.
 * Returns user profile, loading state, and auth actions.
 */
export function useAuth() {
    const { user, firebaseUser, loading, signInWithEmail, logout, refreshUser, getToken } =
        useAuthContext();

    return {
        /** MongoDB user profile (null if not authenticated) */
        user,
        /** Firebase user object */
        firebaseUser,
        /** True while auth state is being determined */
        loading,
        /** Whether the user is authenticated */
        isAuthenticated: !!user,
        /** Sign in with email + password */
        signIn: signInWithEmail,
        /** Sign out */
        signOut: logout,
        /** Re-fetch user profile from server */
        refreshUser,
        /** Get current Firebase ID token for API calls */
        getToken,
    };
}
