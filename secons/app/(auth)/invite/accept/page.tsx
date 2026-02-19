"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function AcceptInviteForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { signIn } = useAuth();

    const token = searchParams.get("token");
    const invitationId = searchParams.get("id");

    const [invitation, setInvitation] = useState<{
        name: string;
        role: string;
        domain: string;
        email: string;
    } | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<"loading" | "ready" | "invalid">("loading");

    // Validate the invitation on load
    useEffect(() => {
        if (!token || !invitationId) {
            setStatus("invalid");
            setError("Invalid invitation link. Please check your email and try again.");
            return;
        }
        // For now, we'll just show the form. The actual validation
        // happens on submit since we can't expose token verification publicly.
        setStatus("ready");
    }, [token, invitationId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/invitations/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, invitationId }),
            });

            const data = await res.json();
            if (!data.success) {
                setError(data.error || "Failed to accept invitation");
                return;
            }

            // Auto-login with the new credentials
            await signIn(data.data.email, password);
            router.replace("/onboarding");
        } catch (err) {
            setError((err as Error).message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: "60px 0" }}>
                <p>Verifying invitation...</p>
            </div>
        );
    }

    if (status === "invalid") {
        return (
            <div style={{
                background: "white", borderRadius: "16px", padding: "32px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)", textAlign: "center",
            }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
                <h2 style={{
                    fontFamily: "var(--font-display)", fontSize: "20px",
                    color: "#1A1A2E", marginBottom: "8px",
                }}>
                    Invalid Invitation
                </h2>
                <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px" }}>{error}</p>
                <a
                    href="/login"
                    style={{
                        display: "inline-block", padding: "10px 24px", borderRadius: "10px",
                        background: "#1A3C6E", color: "white", fontSize: "14px",
                        fontWeight: 600, textDecoration: "none",
                    }}
                >
                    Go to Login
                </a>
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
                    fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800,
                    color: "white", margin: "0 0 4px",
                }}>
                    Accept Invitation
                </h1>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", margin: 0 }}>
                    Create your password to join SECONS
                </p>
            </div>

            {/* Card */}
            <div style={{
                background: "white", borderRadius: "16px", padding: "32px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}>
                <form onSubmit={handleSubmit}>
                    {/* Password */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{
                            display: "block", fontSize: "13px", fontWeight: 600,
                            color: "#1A1A2E", marginBottom: "6px",
                        }}>
                            Create Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                required
                                minLength={8}
                                style={{
                                    width: "100%", padding: "10px 44px 10px 14px", borderRadius: "10px",
                                    border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
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
                                    fontSize: "13px",
                                }}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={{
                            display: "block", fontSize: "13px", fontWeight: 600,
                            color: "#1A1A2E", marginBottom: "6px",
                        }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            required
                            style={{
                                width: "100%", padding: "10px 14px", borderRadius: "10px",
                                border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#1A3C6E")}
                            onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: "#FEE2E2", color: "#DC2626", borderRadius: "10px",
                            padding: "10px 14px", marginBottom: "16px", fontSize: "13px",
                            border: "1px solid #FECACA",
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%", padding: "12px", borderRadius: "10px",
                            background: loading
                                ? "#94A3B8"
                                : "linear-gradient(135deg, #1A3C6E 0%, #2A5494 100%)",
                            color: "white", border: "none",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-display)",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Creating account..." : "Create Account & Join"}
                    </button>
                </form>

                <p style={{
                    textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#6B7280",
                }}>
                    Already have an account?{" "}
                    <a href="/login" style={{ color: "#1A3C6E", fontWeight: 600, textDecoration: "underline" }}>
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: "60px 0" }}>
                <p>Loading...</p>
            </div>
        }>
            <AcceptInviteForm />
        </Suspense>
    );
}
