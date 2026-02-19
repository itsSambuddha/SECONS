"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const ROLE_LABELS: Record<string, string> = {
    ga: "General Animator",
    jga: "Joint General Animator",
    animator: "Animator",
    volunteer: "Volunteer",
    student: "Student",
};

// Roles that MUST upload a photo (shown on contact page)
const PHOTO_REQUIRED_ROLES = ["ga", "jga", "animator"];

const STEPS = [
    { title: "Welcome", description: "Let's get you started with SECONS" },
    { title: "Your Profile", description: "Upload your photo" },
    { title: "You're All Set", description: "Start using SECONS" },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user, getToken, refreshUser, loading: authLoading } = useAuth();
    const [step, setStep] = useState(0);
    const [photoURL, setPhotoURL] = useState("");
    const [photoPreview, setPhotoPreview] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isPhotoRequired = user ? PHOTO_REQUIRED_ROLES.includes(user.role) : false;

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.replace("/login");
            } else if (user.onboardingComplete) {
                router.replace("/dashboard");
            }
        }
    }, [user, authLoading, router]);

    const handleFileSelect = async (file: File) => {
        setUploadError("");

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setUploadError("Only JPEG, PNG, and WebP images are allowed");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setUploadError("File size must be under 2MB");
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append("avatar", file);

            const res = await fetch("/api/upload/avatar", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setPhotoURL(data.data.url);
            } else {
                setUploadError(data.error || "Upload failed");
                setPhotoPreview("");
            }
        } catch {
            setUploadError("Upload failed. Please try again.");
            setPhotoPreview("");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const finishOnboarding = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            await fetch("/api/auth/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    onboardingComplete: true,
                    tourComplete: true,
                    ...(photoURL ? { photoURL } : {}),
                }),
            });
            await refreshUser();
            router.replace("/dashboard");
        } catch (err) {
            console.error("Onboarding error:", err);
        } finally {
            setSaving(false);
        }
    };

    // Can proceed from step 1 only if photo uploaded (when required)
    const canProceedFromStep1 = isPhotoRequired ? !!photoURL : true;

    if (authLoading || !user) {
        return (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: "60px 0" }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Progress */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
                {STEPS.map((_, i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1, height: "4px", borderRadius: "2px",
                            background: i <= step ? "#E8A020" : "rgba(255,255,255,0.2)",
                            transition: "background 0.3s",
                        }}
                    />
                ))}
            </div>

            <div style={{
                background: "white", borderRadius: "16px", padding: "32px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)", minHeight: "360px",
                display: "flex", flexDirection: "column",
            }}>
                {/* Step Header */}
                <div style={{ marginBottom: "24px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#E8A020", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Step {step + 1} of {STEPS.length}
                    </p>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "#1A1A2E", marginBottom: "4px" }}>
                        {STEPS[step].title}
                    </h2>
                    <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
                        {STEPS[step].description}
                    </p>
                </div>

                {/* Step Content */}
                <div style={{ flex: 1 }}>
                    {step === 0 && (
                        <div>
                            <div style={{
                                background: "#EBF0F7", borderRadius: "12px", padding: "20px",
                                marginBottom: "20px",
                            }}>
                                <p style={{ fontSize: "14px", color: "#1A3C6E", margin: "0 0 12px", fontWeight: 600 }}>
                                    Welcome, {user.name}! 👋
                                </p>
                                <p style={{ fontSize: "14px", color: "#1A1A2E", margin: "0 0 12px", lineHeight: 1.6 }}>
                                    You&apos;ve joined SECONS as{" "}
                                    <strong>{ROLE_LABELS[user.role] || user.role}</strong>
                                    {user.domain !== "general" ? ` in the ${user.domain} domain` : ""}.
                                </p>
                                <p style={{ fontSize: "14px", color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
                                    SECONS is the central platform for managing EdBlazon — your college&apos;s annual cultural &amp; sports week.
                                </p>
                            </div>

                            <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                                {[
                                    { icon: "📅", label: "Manage Events" },
                                    { icon: "🏆", label: "Track Scores" },
                                    { icon: "💰", label: "Handle Finances" },
                                    { icon: "💬", label: "Team Chat" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        style={{
                                            background: "#F8F9FB", borderRadius: "10px", padding: "14px",
                                            textAlign: "center", fontSize: "13px", color: "#1A1A2E",
                                        }}
                                    >
                                        <div style={{ fontSize: "24px", marginBottom: "4px" }}>{item.icon}</div>
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div>
                            {/* Photo Upload */}
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                    style={{ display: "none" }}
                                />

                                {/* Avatar Preview / Upload Area */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    style={{
                                        width: "120px", height: "120px", borderRadius: "50%",
                                        margin: "0 auto 12px", cursor: "pointer",
                                        overflow: "hidden", position: "relative",
                                        border: photoPreview ? "3px solid #E8A020" : "3px dashed #CBD5E1",
                                        background: photoPreview ? "transparent" : "#F8F9FB",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "border-color 0.2s",
                                    }}
                                >
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Profile preview"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div style={{ textAlign: "center", padding: "8px" }}>
                                            <div style={{ fontSize: "28px", marginBottom: "2px" }}>📷</div>
                                            <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                                                Click to upload
                                            </span>
                                        </div>
                                    )}

                                    {uploading && (
                                        <div style={{
                                            position: "absolute", inset: 0,
                                            background: "rgba(255,255,255,0.8)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <div style={{
                                                width: "24px", height: "24px",
                                                border: "3px solid #E2E8F0", borderTopColor: "#1A3C6E",
                                                borderRadius: "50%", animation: "spin 0.8s linear infinite",
                                            }} />
                                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                        </div>
                                    )}
                                </div>

                                <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 4px" }}>
                                    {photoPreview ? "Click to change photo" : "Click or drag & drop your photo"}
                                </p>
                                <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>
                                    JPEG, PNG, or WebP · Max 2MB
                                    {isPhotoRequired && (
                                        <span style={{ color: "#DC2626", fontWeight: 600 }}> · Required</span>
                                    )}
                                </p>

                                {uploadError && (
                                    <p style={{ fontSize: "12px", color: "#DC2626", margin: "8px 0 0" }}>
                                        {uploadError}
                                    </p>
                                )}
                            </div>

                            <div style={{
                                background: "#F8F9FB", borderRadius: "12px", padding: "16px",
                            }}>
                                <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
                                    <strong>Your details:</strong><br />
                                    Name: {user.name}<br />
                                    Email: {user.email}<br />
                                    Role: {ROLE_LABELS[user.role]}<br />
                                    Domain: {user.domain}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ textAlign: "center", paddingTop: "20px" }}>
                            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
                            <h3 style={{
                                fontFamily: "var(--font-display)", fontSize: "20px",
                                color: "#1A1A2E", marginBottom: "8px",
                            }}>
                                You&apos;re ready to go!
                            </h3>
                            <p style={{ color: "#6B7280", fontSize: "14px", maxWidth: "300px", margin: "0 auto", lineHeight: 1.6 }}>
                                Your account is all set up. Head to your dashboard to start managing EdBlazon.
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #E2E8F0",
                }}>
                    {step > 0 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            style={{
                                padding: "10px 20px", borderRadius: "10px",
                                background: "transparent", border: "1px solid #E2E8F0",
                                color: "#6B7280", cursor: "pointer", fontSize: "14px", fontWeight: 500,
                            }}
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < STEPS.length - 1 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 && !canProceedFromStep1}
                            style={{
                                padding: "10px 24px", borderRadius: "10px",
                                background: (step === 1 && !canProceedFromStep1)
                                    ? "#E5E7EB"
                                    : "linear-gradient(135deg, #1A3C6E 0%, #2A5494 100%)",
                                color: (step === 1 && !canProceedFromStep1) ? "#9CA3AF" : "white",
                                border: "none",
                                cursor: (step === 1 && !canProceedFromStep1) ? "not-allowed" : "pointer",
                                fontSize: "14px", fontWeight: 600,
                            }}
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={finishOnboarding}
                            disabled={saving}
                            style={{
                                padding: "10px 24px", borderRadius: "10px",
                                background: saving
                                    ? "#94A3B8"
                                    : "linear-gradient(135deg, #E8A020 0%, #F0B84D 100%)",
                                color: "#1A1A2E", border: "none",
                                cursor: saving ? "not-allowed" : "pointer",
                                fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)",
                            }}
                        >
                            {saving ? "Saving..." : "Go to Dashboard →"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
