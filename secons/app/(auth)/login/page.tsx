"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { ApiResponse } from "@/types/api";

// ============================================================
// Login Page — Handles GA Registration & Invitation Gateway
// ============================================================
type LoginStep = "checking" | "ga-register" | "gateway" | "invite-ready" | "sign-in" | "unauthorized";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signInWithGoogle, user, firebaseUser, loading: authLoading, getToken, signOut, refreshUser } = useAuth();

    const [step, setStep] = useState<LoginStep>("checking");
    const [accessCode, setAccessCode] = useState("");
    const [inviteInfo, setInviteInfo] = useState<{ role: string; domain: string } | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 1. Initial State Determination
    useEffect(() => {
        async function determineInitialState() {
            try {
                // Check if GA exists
                const res = await fetch("/api/auth/ga-status");
                const data = await res.json();
                const hasGA = data.data?.hasActiveGA;

                if (!hasGA) {
                    setStep("ga-register");
                } else {
                    // If GA exists, check for code in URL
                    const codeFromUrl = searchParams.get("code");
                    if (codeFromUrl && codeFromUrl.length === 6) {
                        setAccessCode(codeFromUrl);
                        await validateCode(codeFromUrl);
                    } else {
                        setStep("gateway");
                    }
                }
            } catch (err) {
                setStep("gateway");
            }
        }
        determineInitialState();
    }, [searchParams]);

    // 2. Redirect logic:
    // - If has MongoDB profile -> Dashboard/Onboarding
    // - If has Firebase User but NO profile -> Unauthorized state (unless registering)
    useEffect(() => {
        if (authLoading) return;

        if (user) {
            router.replace(user.onboardingComplete ? "/dashboard" : "/onboarding");
        } else if (firebaseUser && step !== "ga-register" && step !== "invite-ready") {
            // Signed in to Google, but no account in our system
            setStep("unauthorized");
        }
    }, [user, firebaseUser, authLoading, router, step]);

    // Validate 6-char access code
    const validateCode = async (code: string) => {
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`/api/invitations/validate?code=${code}`);
            const data: ApiResponse<{ role: string; domain: string }> = await res.json();

            if (data.success && data.data) {
                setInviteInfo(data.data);
                setStep("invite-ready");
            } else {
                setError(data.error || "Invalid or expired access code");
                setStep("gateway");
            }
        } catch (err) {
            setError("Failed to validate code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle GA Registration (First user)
    const handleGARegistration = async () => {
        setError("");
        setLoading(true);
        try {
            // 1. Sign in with Google to get UID/Email
            await signInWithGoogle();
            const token = await getToken();

            // 2. Register role as GA in MongoDB
            const res = await fetch("/api/auth/register-ga", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "GA Registration failed");
                await signOut(); // Ensure clean state if registration fails
                return;
            }

            // 3. IMPORTANT: Refresh user profile so AuthProvider sees the new MongoDB record
            await refreshUser();

            // Success -> Will be redirected by the useEffect, but we can also push
            router.replace("/onboarding");
        } catch (err) {
            setError((err as Error).message || "Registration failed");
            await signOut();
        } finally {
            setLoading(false);
        }
    };

    // Handle Invitation Acceptance
    const handleAcceptInvite = async () => {
        setError("");
        setLoading(true);
        try {
            // 1. Sign in with Google
            await signInWithGoogle();
            const firebaseToken = await getToken();

            // 2. Accept invite in MongoDB
            const res = await fetch("/api/invitations/accept", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${firebaseToken}`
                },
                body: JSON.stringify({ code: accessCode }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "Failed to accept invitation");
                await signOut();
                return;
            }

            // 3. Refresh user profile
            await refreshUser();

            router.replace("/onboarding");
        } catch (err) {
            setError((err as Error).message || "Acceptance failed");
            await signOut();
        } finally {
            setLoading(false);
        }
    };

    // Handle Standard Sign-In (Existing User)
    const handleSignIn = async () => {
        setError("");
        setLoading(true);
        try {
            await signInWithGoogle();
            // User effect handles the rest.
        } catch (err) {
            setError("Google Sign-In failed");
        } finally {
            setLoading(false);
        }
    };

    if (step === "checking" || (authLoading && !error)) {
        return (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: "100px 0" }}>
                <div style={{
                    width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#E8A020", borderRadius: "50%", margin: "0 auto 16px",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p>Establishing secure connection...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            {/* Logo Section */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                    width: "56px", height: "56px", borderRadius: "16px",
                    background: "linear-gradient(135deg, #E8A020 0%, #F0B84D 100%)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "16px", boxShadow: "0 8px 24px rgba(232, 160, 32, 0.3)",
                }}>
                    <span style={{ color: "#1A1A2E", fontSize: "24px", fontWeight: 900 }}>S</span>
                </div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "white", margin: "0 0 4px" }}>SECONS</h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                    EdBlazon Authentication Gateway
                </p>
            </div>

            {/* Auth Card */}
            <div style={{
                background: "white", borderRadius: "20px", padding: "32px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
            }}>

                {/* Error Display */}
                {error && (
                    <div style={{
                        background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5",
                        borderRadius: "12px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px"
                    }}>
                        {error}
                    </div>
                )}

                {/* STEP: GA REGISTRATION */}
                {step === "ga-register" && (
                    <>
                        <div style={{
                            background: "#FEF6E8", border: "1px solid #F5C675", borderRadius: "12px",
                            padding: "16px", marginBottom: "24px", fontSize: "13px", color: "#8C6013",
                        }}>
                            <strong>🎓 System Bootstrap</strong>
                            <br />
                            No General Animator found. As the first user, you will be registered with full system authority.
                        </div>
                        <button
                            onClick={handleGARegistration}
                            disabled={loading}
                            style={buttonStyle(true)}
                        >
                            <GoogleIcon />
                            {loading ? "Registering..." : "Sign in with Google"}
                        </button>
                    </>
                )}

                {/* STEP: ACCESS CODE ENTRY */}
                {step === "gateway" && (
                    <>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1A1A2E", marginBottom: "8px" }}>
                                Enter Access Code
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                placeholder="6-CHAR CODE"
                                style={inputStyle}
                            />
                        </div>
                        <button
                            onClick={() => validateCode(accessCode)}
                            disabled={loading || accessCode.length !== 6}
                            style={buttonStyle(false)}
                        >
                            {loading ? "Validating..." : "Verify Access Code"}
                        </button>
                        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#6B7280" }}>
                            Already a member?{" "}
                            <button onClick={() => setStep("sign-in")} style={linkButtonStyle}>Sign in directly</button>
                        </p>
                    </>
                )}

                {/* STEP: INVITE READY (Code Verified) */}
                {step === "invite-ready" && inviteInfo && (
                    <>
                        <div style={{
                            background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "12px",
                            padding: "16px", marginBottom: "24px", fontSize: "14px", color: "#0369A1",
                        }}>
                            <strong>✅ Valid Invitation</strong>
                            <br />
                            Access code verified for <strong>{inviteInfo.role.toUpperCase()}</strong> role.
                        </div>
                        <button
                            onClick={handleAcceptInvite}
                            disabled={loading}
                            style={buttonStyle(false)}
                        >
                            <GoogleIcon />
                            {loading ? "Assigning Role..." : "Sign in with Google"}
                        </button>
                        <button
                            onClick={() => setStep("gateway")}
                            style={{ ...linkButtonStyle, display: "block", margin: "16px auto 0", fontSize: "12px" }}
                        >
                            Use a different code
                        </button>
                    </>
                )}

                {/* STEP: DIRECT SIGN IN */}
                {step === "sign-in" && (
                    <>
                        <h2 style={{ fontSize: "18px", fontWeight: 700, textAlign: "center", marginBottom: "24px", color: "#1A1A2E" }}>
                            Welcome Back
                        </h2>
                        <button
                            onClick={handleSignIn}
                            disabled={loading}
                            style={buttonStyle(false)}
                        >
                            <GoogleIcon />
                            {loading ? "Checking identity..." : "Sign in with Google"}
                        </button>
                        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#6B7280" }}>
                            New here?{" "}
                            <button onClick={() => setStep("gateway")} style={linkButtonStyle}>Enter access code</button>
                        </p>
                    </>
                )}

                {/* STEP: UNAUTHORIZED (Google Sign-In OK, but no DB profile) */}
                {step === "unauthorized" && (
                    <>
                        <div style={{
                            background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "12px",
                            padding: "16px", marginBottom: "24px", fontSize: "13px", color: "#991B1B",
                        }}>
                            <strong>⛔ Access Denied</strong>
                            <br />
                            This Google account is not registered. Please use an invitation code to join SECONS.
                        </div>
                        <button
                            onClick={async () => {
                                await signOut();
                                setStep("gateway");
                            }}
                            style={buttonStyle(false)}
                        >
                            Sign Out & Try Again
                        </button>
                    </>
                )}

            </div>

            {/* Platform Info */}
            <p style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                SECONS · Secure Access Protocol
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: "100px 0" }}>
                <div style={{
                    width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#E8A020", borderRadius: "50%", margin: "0 auto 16px",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p>Loading gateway...</p>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

// Google Icon Component
function GoogleIcon() {
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            marginRight: "10px",
            verticalAlign: "middle"
        }}>
            <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
        </span>
    );
}

// Styles
const buttonStyle = (isGold: boolean) => ({
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    background: isGold
        ? "linear-gradient(135deg, #E8A020 0%, #F0B84D 100%)"
        : "linear-gradient(135deg, #1A3C6E 0%, #2A5494 100%)",
    color: isGold ? "#1A1A2E" : "white",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 700,
    transition: "transform 0.2s, opacity 0.2s",
    boxShadow: isGold ? "0 4px 12px rgba(232,160,32,0.2)" : "0 4px 12px rgba(26,60,110,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "2px solid #E2E8F0",
    fontSize: "16px",
    fontWeight: 600,
    letterSpacing: "2px",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
    outline: "none",
};

const linkButtonStyle = {
    color: "#1A3C6E",
    fontWeight: 700,
    textDecoration: "underline",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
};
