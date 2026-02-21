"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth";
import { getAuthInstance, signInWithGoogle, signOut as firebaseSignOut, getIdToken } from "@/lib/firebase-client";
import type { IUser } from "@/models/User";
import type { ApiResponse } from "@/types/api";

interface AuthContextType {
    user: IUser | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    getToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    signInWithGoogle: async () => { },
    signIn: async () => { },
    signOut: async () => { },
    refreshUser: async () => { },
    getToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<IUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
        try {
            const token = await firebaseUser.getIdToken();
            const res = await fetch("/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result: ApiResponse<IUser> = await res.json();
            if (result.success && result.data) {
                setUser(result.data);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setUser(null);
        }
    }, []);

    useEffect(() => {
        const auth = getAuthInstance();
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                await fetchUserProfile(fbUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchUserProfile]);

    const handleSignInWithGoogle = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            // User profile will be fetched by onAuthStateChanged listener
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            setLoading(false);
            throw error;
        }
    };

    const handleSignIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const auth = getAuthInstance();
            await signInWithEmailAndPassword(auth, email, password);
            // User profile will be fetched by onAuthStateChanged listener
        } catch (error) {
            console.error("Sign-In Error:", error);
            setLoading(false);
            throw error;
        }
    };

    const handleSignOut = async () => {
        try {
            await firebaseSignOut();
            setUser(null);
        } catch (error) {
            console.error("Sign-Out Error:", error);
        }
    };

    const refreshUser = async () => {
        const auth = getAuthInstance();
        if (auth.currentUser) {
            await fetchUserProfile(auth.currentUser);
        }
    };

    const getToken = async (forceRefresh: boolean = false) => {
        const auth = getAuthInstance();
        if (!auth.currentUser) return null;
        return await getIdToken(auth.currentUser, forceRefresh);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                signInWithGoogle: handleSignInWithGoogle,
                signIn: handleSignIn,
                signOut: handleSignOut,
                refreshUser,
                getToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
