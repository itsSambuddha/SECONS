import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
    getAuth,
    signOut as firebaseSignOut,
    signInWithPopup,
    GoogleAuthProvider,
    type Auth,
    type User,
} from "firebase/auth";

// ============================================================
// Firebase Client SDK Singleton
// ============================================================

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let app: FirebaseApp;
let auth: Auth;

function getFirebaseApp(): FirebaseApp {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

// Initialize
if (typeof window !== "undefined") {
    app = getFirebaseApp();
    auth = getAuth(app);
}

// Sign in with Google
export async function signInWithGoogle() {
    const authInstance = getAuth(getFirebaseApp());
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(authInstance, provider);
    return result.user;
}

// Sign out
export async function signOut() {
    const authInstance = getAuth(getFirebaseApp());
    await firebaseSignOut(authInstance);
}

// Get current ID token
export async function getIdToken(user?: User | null): Promise<string | null> {
    const authInstance = getAuth(getFirebaseApp());
    const currentUser = user || authInstance.currentUser;
    if (!currentUser) return null;
    return currentUser.getIdToken();
}

// Get current user
export function getCurrentUser(): User | null {
    const authInstance = getAuth(getFirebaseApp());
    return authInstance.currentUser;
}

// Export auth instance for onAuthStateChanged etc
export function getAuthInstance(): Auth {
    return getAuth(getFirebaseApp());
}

export { auth };
