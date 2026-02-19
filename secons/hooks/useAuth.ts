"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/providers/AuthProvider";

/**
 * Hook to access authentication context throughout the application.
 * 
 * Provides:
 * - user: The current authenticated user's MongoDB profile (null if not logged in)
 * - loading: Boolean indicating if auth state is still being determined
 * - signInWithGoogle: Method to trigger Google Sign-In popup
 * - signOut: Method to sign the user out of Firebase and clear the profile
 * - refreshUser: Method to re-fetch the user profile from the server
 * - getToken: Method to get the current Firebase ID token for API requests
 * 
 * @returns AuthContextType
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return {
        user: context.user,
        firebaseUser: context.firebaseUser,
        loading: context.loading,
        signInWithGoogle: context.signInWithGoogle,
        signIn: context.signIn,
        signOut: context.signOut,
        refreshUser: context.refreshUser,
        getToken: context.getToken,
        isAuthenticated: !!context.firebaseUser,
        hasProfile: !!context.user,
        onboardingComplete: context.user?.onboardingComplete || false,
    };
}
