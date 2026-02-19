"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// ============================================================
// Login Page — also handles GA Registration
// ============================================================
export default function LoginPage() {
    const router = useRouter();
    const { signIn, user, loading: authLoading } = useAuth();

    const [mode, setMode] = useState<"login" | "register-ga" | "checking">("checking");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.replace(user.onboardingComplete ? "/dashboard" : "/onboarding");
        }
    }, [user, authLoading, router]);

    // Check GA status
    useEffect(() => {
        async function checkGA() {
            try {
                const res = await fetch("/api/auth/ga-status");
                const data = await res.json();
                setMode(data.data?.hasActiveGA ? "login" : "register-ga");
            } catch {
                setMode("login");
            }
        }
        checkGA();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const profile = await signIn(email, password);
            router.replace(profile.onboardingComplete ? "/dashboard" : "/onboarding");
        } catch (err) {
            const msg = (err as Error).message;
            if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password")) {
                setError("Invalid email or password");
            } else if (msg.includes("auth/user-not-found")) {
                setError("No account found with this email");
            } else if (msg.includes("auth/too-many-requests")) {
                setError("Too many attempts. Please try again later.");
            } else {
                setError(msg || "Login failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterGA = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/register-ga", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "Registration failed");
                return;
            }

            // Auto-login
            await signIn(email, password);
            router.replace("/onboarding");
        } catch (err) {
            setError((err as Error).message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    if (mode === "checking" || authLoading) {
        return (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: "60px 0" }}>
                <div style={{
                    width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#E8A020", borderRadius: "50%", margin: "0 auto 16px",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <div style={{
                    width: "56px", height: "56px", borderRadius: "16px",
                    background: "linear-gradient(135deg, #E8A020 0%, #F0B84D 100%)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "16px", boxShadow: "0 8px 24px rgba(232, 160, 32, 0.3)",
                }}>
                    <span style={{ color: "#1A1A2E", fontSize: "24px", fontWeight: 900, fontFamily: "var(--font-display)" }}>S</span>
                </div>
                <h1 style={{
                    fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800,
                    color: "white", margin: "0 0 4px",
                }}>
                    SECONS
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>
                    {mode === "register-ga"
                        ? "No General Animator found. Register to get started."
                        : "Sign in to your account"
                    }
                </p>
            </div>

            {/* Card */}
            <div style={{
                background: "white", borderRadius: "16px", padding: "32px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
            }}>
                {/* Mode toggle */}
                {mode === "register-ga" && (
                    <div style={{
                        background: "#FEF6E8", border: "1px solid #F5C675", borderRadius: "10px",
                        padding: "12px 16px", marginBottom: "24px", fontSize: "13px", color: "#8C6013",
                    }}>
                        <strong>🎓 Become the General Animator</strong>
                        <br />
                        You&apos;ll have full control over SECONS — manage events, invite team members, and run EdBlazon.
                    </div>
                )}

                <form onSubmit={mode === "register-ga" ? handleRegisterGA : handleLogin}>
                    {/* Name (registration only) */}
                    {mode === "register-ga" && (
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{
                                display: "block", fontSize: "13px", fontWeight: 600,
                                color: "#1A1A2E", marginBottom: "6px",
                            }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Sambuddha Chakraborty"
                                required
                                style={{
                                    width: "100%", padding: "10px 14px", borderRadius: "10px",
                                    border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                    transition: "border-color 0.2s",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "#1A3C6E")}
                                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{
                            display: "block", fontSize: "13px", fontWeight: 600,
                            color: "#1A1A2E", marginBottom: "6px",
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@college.edu"
                            required
                            style={{
                                width: "100%", padding: "10px 14px", borderRadius: "10px",
                                border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                transition: "border-color 0.2s",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#1A3C6E")}
                            onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={{
                            display: "block", fontSize: "13px", fontWeight: 600,
                            color: "#1A1A2E", marginBottom: "6px",
                        }}>
                            Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === "register-ga" ? "Create a strong password (8+ chars)" : "Enter your password"}
                                required
                                minLength={mode === "register-ga" ? 8 : undefined}
                                style={{
                                    width: "100%", padding: "10px 44px 10px 14px", borderRadius: "10px",
                                    border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                    transition: "border-color 0.2s",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "#1A3C6E")}
                                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute", right: "12px", top: "50%",
                                    transform: "translateY(-50%)", background: "none",
                                    border: "none", cursor: "pointer", color: "#6B7280",
                                    fontSize: "13px", padding: "2px",
                                }}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: "#FEE2E2", color: "#DC2626", borderRadius: "10px",
                            padding: "10px 14px", marginBottom: "16px", fontSize: "13px",
                            border: "1px solid #FECACA",
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "12px", borderRadius: "10px",
                            background: loading
                                ? "#94A3B8"
                                : mode === "register-ga"
                                    ? "linear-gradient(135deg, #E8A020 0%, #F0B84D 100%)"
                                    : "linear-gradient(135deg, #1A3C6E 0%, #2A5494 100%)",
                            color: mode === "register-ga" && !loading ? "#1A1A2E" : "white",
                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)",
                            transition: "opacity 0.2s", opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading
                            ? "Please wait..."
                            : mode === "register-ga"
                                ? "Register as General Animator"
                                : "Sign In"
                        }
                    </button>
                </form>

                {/* Toggle mode link */}
                {mode === "login" && (
                    <p style={{
                        textAlign: "center", marginTop: "20px", fontSize: "13px",
                        color: "#6B7280",
                    }}>
                        Received an invitation?{" "}
                        <a
                            href="/invite/accept"
                            style={{ color: "#1A3C6E", fontWeight: 600, textDecoration: "underline" }}
                        >
                            Accept here
                        </a>
                    </p>
                )}

                {mode === "register-ga" && (
                    <p style={{
                        textAlign: "center", marginTop: "20px", fontSize: "13px",
                        color: "#6B7280",
                    }}>
                        Already have an account?{" "}
                        <button
                            onClick={() => setMode("login")}
                            style={{
                                color: "#1A3C6E", fontWeight: 600, textDecoration: "underline",
                                background: "none", border: "none", cursor: "pointer", fontSize: "13px",
                            }}
                        >
                            Sign in
                        </button>
                    </p>
                )}
            </div>

            {/* Footer */}
            <p style={{
                textAlign: "center", marginTop: "24px", fontSize: "12px",
                color: "rgba(255,255,255,0.4)",
            }}>
                SECONS · EdBlazon Platform
            </p>
        </div>
    );
}
