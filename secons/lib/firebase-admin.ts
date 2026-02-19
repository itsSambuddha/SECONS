import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import type { UserRole, UserDomain } from "@/types/auth";

// ============================================================
// Firebase Admin SDK Singleton
// ============================================================

function getFirebaseAdmin() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };

    return initializeApp({
        credential: cert(serviceAccount),
    });
}

const app = getFirebaseAdmin();
const adminAuth = getAuth(app);

// Verify a Firebase ID token and return decoded claims
export async function verifyAndDecodeToken(token: string): Promise<DecodedIdToken> {
    try {
        const decoded = await adminAuth.verifyIdToken(token);
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
    await adminAuth.setCustomUserClaims(uid, claims);
}

// Get user by email
export async function getUserByEmail(email: string) {
    try {
        return await adminAuth.getUserByEmail(email);
    } catch {
        return null;
    }
}

// Create a new Firebase user
export async function createFirebaseUser(email: string, password: string, displayName: string) {
    return adminAuth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
    });
}

// Delete a Firebase user
export async function deleteFirebaseUser(uid: string) {
    await adminAuth.deleteUser(uid);
}

// Batch delete users (for year-end reset)
export async function batchDeleteUsers(uids: string[]) {
    // Firebase Admin limits to 1000 users per batch
    const batches = [];
    for (let i = 0; i < uids.length; i += 1000) {
        batches.push(uids.slice(i, i + 1000));
    }

    for (const batch of batches) {
        await adminAuth.deleteUsers(batch);
    }
}

export { adminAuth };
