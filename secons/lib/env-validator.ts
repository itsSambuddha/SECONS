import { z } from "zod";

// ============================================================
// Environment Variable Validator
// ============================================================

const envSchema = z.object({
    // MongoDB
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

    // Firebase Admin
    FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
    FIREBASE_CLIENT_EMAIL: z.string().email("FIREBASE_CLIENT_EMAIL must be a valid email"),
    FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),

    // Firebase Client
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "NEXT_PUBLIC_FIREBASE_API_KEY is required"),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required"),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),

    // Security
    INVITATION_SECRET: z.string().min(16, "INVITATION_SECRET must be at least 16 chars"),
    ENCRYPTION_KEY: z.string().min(16, "ENCRYPTION_KEY must be at least 16 chars"),

    // App
    NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional().default("http://localhost:3000"),
});

// Optional env vars (won't throw if missing)
const optionalEnvSchema = z.object({
    UPLOADTHING_SECRET: z.string().optional(),
    UPLOADTHING_APP_ID: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
    if (cachedEnv) return cachedEnv;

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const errors = result.error.issues
            .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");

        console.error(
            `\n❌ Missing or invalid environment variables:\n${errors}\n\nCopy env.example to .env.local and fill in all required values.\n`
        );

        throw new Error("Invalid environment configuration. Check the console for details.");
    }

    cachedEnv = result.data;
    return cachedEnv;
}

// Validate a subset of env (for modules that don't need everything)
export function getMongoUri(): string {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is required. Check your .env.local file.");
    return uri;
}

export function getFirebaseConfig() {
    return {
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    };
}

export function getClientFirebaseConfig() {
    return {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    };
}
