"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getAuthInstance, signIn, signOut, getIdToken } from "@/lib/firebase-client";
import type { SessionUser } from "@/types/auth";

// ============================================================
// Auth Context
// ============================================================

interface AuthContextType {
    user: SessionUser | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<SessionUser>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    signInWithEmail: async () => {
        throw new Error("AuthProvider not mounted");
    },
    logout: async () => { },
    refreshUser: async () => { },
    getToken: async () => null,
});

// ============================================================
// Auth Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch the MongoDB user profile using the Firebase token
    const fetchProfile = useCallback(async (fbUser: FirebaseUser): Promise<SessionUser | null> => {
        try {
            const token = await fbUser.getIdToken();
            const res = await fetch("/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.data as SessionUser;
        } catch {
            return null;
        }
    }, []);

    // Listen to Firebase auth state
    useEffect(() => {
        const auth = getAuthInstance();
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                const profile = await fetchProfile(fbUser);
                setUser(profile);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchProfile]);

    // Sign in
    const signInWithEmail = useCallback(
        async (email: string, password: string): Promise<SessionUser> => {
            setLoading(true);
            try {
                const fbUser = await signIn(email, password);
                setFirebaseUser(fbUser);
                const profile = await fetchProfile(fbUser);
                if (!profile) {
                    throw new Error("User profile not found. Contact the General Animator.");
                }
                setUser(profile);
                return profile;
            } finally {
                setLoading(false);
            }
        },
        [fetchProfile]
    );

    // Sign out
    const logout = useCallback(async () => {
        await signOut();
        setUser(null);
        setFirebaseUser(null);
    }, []);

    // Refresh profile
    const refreshUser = useCallback(async () => {
        if (firebaseUser) {
            const profile = await fetchProfile(firebaseUser);
            setUser(profile);
        }
    }, [firebaseUser, fetchProfile]);

    // Get token
    const getToken = useCallback(async (): Promise<string | null> => {
        return getIdToken(firebaseUser);
    }, [firebaseUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                signInWithEmail,
                logout,
                refreshUser,
                getToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================
// Hook
// ============================================================

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuthContext must be used inside AuthProvider");
    }
    return ctx;
}
