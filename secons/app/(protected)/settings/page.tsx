"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

const ROLE_LABELS: Record<string, string> = {
    ga: "General Animator",
    jga: "Joint General Animator",
    animator: "Animator",
    volunteer: "Volunteer",
    student: "Student",
};

export default function SettingsPage() {
    const router = useRouter();
    const { user, getToken, signOut, refreshUser } = useAuth();
    const { isGA } = useRole();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    // Profile update
    const [name, setName] = useState(user?.name || "");
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || "");
    const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
    const [photoPreview, setPhotoPreview] = useState(user?.photoURL || "");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(file);

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
                setUploadError("");
            } else {
                setUploadError(data.error || "Upload failed");
                setPhotoPreview(user?.photoURL || "");
            }
        } catch {
            setUploadError("Upload failed. Please try again.");
            setPhotoPreview(user?.photoURL || "");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveMsg("");
        try {
            const token = await getToken();
            const res = await fetch("/api/auth/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, photoURL, phoneNumber, whatsappNumber }),
            });
            const data = await res.json();
            if (data.success) {
                setSaveMsg("Profile updated!");
                await refreshUser();
            } else {
                setSaveMsg(data.error || "Update failed");
            }
        } catch {
            setSaveMsg("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        if (deleteInput !== "DELETE") return;

        setDeleting(true);
        setError("");
        try {
            const token = await getToken();
            const res = await fetch(`/api/users/${user._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                await signOut();
                router.replace("/login");
            } else {
                setError(data.error || "Deletion failed");
            }
        } catch {
            setError("Failed to delete account");
        } finally {
            setDeleting(false);
        }
    };

    if (!user) return null;

    return (
        <div style={{ padding: "8px", maxWidth: "600px" }}>
            <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800,
                color: "#1A1A2E", marginBottom: "24px",
            }}>
                Account Settings
            </h1>

            {/* Profile Section */}
            <div style={{
                background: "white", borderRadius: "14px", padding: "24px",
                border: "1px solid #E2E8F0", marginBottom: "20px",
            }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1A1A2E", marginBottom: "16px" }}>
                    Profile
                </h2>
                <form onSubmit={handleSaveProfile}>
                    {/* Photo Upload */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "10px" }}>
                            Profile Photo
                        </label>
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
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: "80px", height: "80px", borderRadius: "50%",
                                    cursor: "pointer", overflow: "hidden", flexShrink: 0,
                                    position: "relative",
                                    border: photoPreview ? "3px solid #E8A020" : "3px dashed #CBD5E1",
                                    background: photoPreview ? "transparent" : "#F8F9FB",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt="Profile"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <span style={{ fontSize: "24px" }}>📷</span>
                                )}
                                {uploading && (
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        background: "rgba(255,255,255,0.8)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <div style={{
                                            width: "20px", height: "20px",
                                            border: "3px solid #E2E8F0", borderTopColor: "#1A3C6E",
                                            borderRadius: "50%", animation: "spin 0.8s linear infinite",
                                        }} />
                                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    </div>
                                )}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    style={{
                                        padding: "6px 14px", borderRadius: "8px",
                                        background: "#F8F9FB", border: "1px solid #E2E8F0",
                                        color: "#1A1A2E", cursor: "pointer", fontSize: "13px",
                                        fontWeight: 500,
                                    }}
                                >
                                    {uploading ? "Uploading..." : "Change Photo"}
                                </button>
                                <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "4px 0 0" }}>
                                    JPEG, PNG, or WebP · Max 2MB
                                </p>
                                {uploadError && (
                                    <p style={{ fontSize: "11px", color: "#DC2626", margin: "2px 0 0" }}>
                                        {uploadError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>
                            Name
                        </label>
                        <input
                            type="text" value={name} onChange={(e) => setName(e.target.value)}
                            style={{
                                width: "100%", padding: "10px 14px", borderRadius: "10px",
                                border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>
                                Phone Number
                            </label>
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#6B7280", fontSize: "14px", fontWeight: 500, pointerEvents: "none" }}>+91</span>
                                <input
                                    type="tel"
                                    value={phoneNumber.replace(/^\+91/, "")}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, "");
                                        if (val.length <= 10) setPhoneNumber("+91" + val);
                                    }}
                                    placeholder="9876543210"
                                    style={{
                                        width: "100%", padding: "10px 14px 10px 50px", borderRadius: "10px",
                                        border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                        boxSizing: "border-box", fontFamily: "monospace", fontWeight: 600
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>
                                WhatsApp Number
                            </label>
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#6B7280", fontSize: "14px", fontWeight: 500, pointerEvents: "none" }}>+91</span>
                                <input
                                    type="tel"
                                    value={whatsappNumber.replace(/^\+91/, "")}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, "");
                                        if (val.length <= 10) setWhatsappNumber("+91" + val);
                                    }}
                                    placeholder="9876543210"
                                    style={{
                                        width: "100%", padding: "10px 14px 10px 50px", borderRadius: "10px",
                                        border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                        boxSizing: "border-box", fontFamily: "monospace", fontWeight: 600
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{
                        background: "#F8F9FB", borderRadius: "10px", padding: "12px 16px",
                        marginBottom: "16px", fontSize: "13px", color: "#6B7280",
                    }}>
                        <strong>Email:</strong> {user.email}<br />
                        <strong>Role:</strong> {ROLE_LABELS[user.role]}<br />
                        <strong>Domain:</strong> {user.domain}
                    </div>

                    {saveMsg && (
                        <p style={{ fontSize: "13px", color: saveMsg.includes("updated") ? "#10B981" : "#EF4444", marginBottom: "12px" }}>
                            {saveMsg}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            padding: "10px 20px", borderRadius: "10px",
                            background: saving ? "#94A3B8" : "#1A3C6E",
                            color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer",
                            fontSize: "14px", fontWeight: 600,
                        }}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Danger Zone */}
            <div style={{
                background: "white", borderRadius: "14px", padding: "24px",
                border: "1px solid #FECACA",
            }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#DC2626", marginBottom: "8px" }}>
                    Danger Zone
                </h2>
                <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "16px", lineHeight: 1.6 }}>
                    {isGA
                        ? "Deleting your account will remove your GA status. A new General Animator will be able to register after deletion."
                        : "Deleting your account will deactivate your access. This action cannot be undone."
                    }
                </p>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                            padding: "10px 20px", borderRadius: "10px",
                            background: "transparent", border: "1px solid #DC2626",
                            color: "#DC2626", cursor: "pointer", fontSize: "14px", fontWeight: 600,
                        }}
                    >
                        Delete My Account
                    </button>
                ) : (
                    <div style={{
                        background: "#FEF2F2", borderRadius: "10px", padding: "16px",
                        border: "1px solid #FECACA",
                    }}>
                        <p style={{ fontSize: "13px", color: "#991B1B", marginBottom: "12px", fontWeight: 600 }}>
                            Type <strong>DELETE</strong> to confirm:
                        </p>
                        <input
                            type="text"
                            value={deleteInput}
                            onChange={(e) => setDeleteInput(e.target.value)}
                            placeholder="Type DELETE"
                            style={{
                                width: "100%", padding: "10px 14px", borderRadius: "8px",
                                border: "1px solid #FECACA", fontSize: "14px", outline: "none",
                                marginBottom: "12px", boxSizing: "border-box",
                            }}
                        />
                        {error && (
                            <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "8px" }}>{error}</p>
                        )}
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                                style={{
                                    flex: 1, padding: "8px", borderRadius: "8px",
                                    background: "white", border: "1px solid #E2E8F0",
                                    color: "#6B7280", cursor: "pointer", fontSize: "13px",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteInput !== "DELETE" || deleting}
                                style={{
                                    flex: 1, padding: "8px", borderRadius: "8px",
                                    background: deleteInput === "DELETE" && !deleting ? "#DC2626" : "#E5E7EB",
                                    color: deleteInput === "DELETE" && !deleting ? "white" : "#9CA3AF",
                                    border: "none",
                                    cursor: deleteInput === "DELETE" && !deleting ? "pointer" : "not-allowed",
                                    fontSize: "13px", fontWeight: 600,
                                }}
                            >
                                {deleting ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
