"use client";

import { useState } from "react";
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
    const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

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
                body: JSON.stringify({ name, photoURL }),
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
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>
                            Photo URL
                        </label>
                        <input
                            type="url" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)}
                            placeholder="https://..."
                            style={{
                                width: "100%", padding: "10px 14px", borderRadius: "10px",
                                border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
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
                        ? "Deleting your account will remove your GA status. A new General Animator will be able to register after deletion. All your invitations and data associations will be preserved."
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
