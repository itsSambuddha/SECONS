import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";
import type { UserRole, UserDomain } from "@/types/auth";

// ============================================================
// Firebase Admin SDK Singleton — Lazy Initialization
// Deferred to avoid crashing during Next.js build (no env vars)
// ============================================================

let _adminAuth: Auth | null = null;

function getAdminAuth(): Auth {
    if (_adminAuth) return _adminAuth;

    let app;
    if (getApps().length > 0) {
        app = getApps()[0];
    } else {
        const serviceAccount: ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        };
        app = initializeApp({ credential: cert(serviceAccount) });
    }

    _adminAuth = getAuth(app);
    return _adminAuth;
}

// Verify a Firebase ID token and return decoded claims
export async function verifyAndDecodeToken(token: string): Promise<DecodedIdToken> {
    try {
        const decoded = await getAdminAuth().verifyIdToken(token);
        return decoded;
    } catch (error) {
        throw new Error(`Token verification failed: ${(error as Error).message}`);
    }
}

// Set custom claims on a user (role, domain)
export async function setCustomClaims(
    uid: string,
    claims: { role: UserRole; domain: UserDomain }
): Promise<void> {
    await getAdminAuth().setCustomUserClaims(uid, claims);
}

// Get user by email
export async function getUserByEmail(email: string) {
    try {
        return await getAdminAuth().getUserByEmail(email);
    } catch {
        return null;
    }
}

// Create a new Firebase user
export async function createFirebaseUser(email: string, password: string, displayName: string) {
    return getAdminAuth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
    });
}

// Delete a Firebase user
export async function deleteFirebaseUser(uid: string) {
    await getAdminAuth().deleteUser(uid);
}

// Batch delete users (for year-end reset)
export async function batchDeleteUsers(uids: string[]) {
    const auth = getAdminAuth();
    const batches = [];
    for (let i = 0; i < uids.length; i += 1000) {
        batches.push(uids.slice(i, i + 1000));
    }
    for (const batch of batches) {
        await auth.deleteUsers(batch);
    }
}

/** @deprecated Use getAdminAuth() internally. Exported for backward compat. */
export const adminAuth = { get: getAdminAuth };
