"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

const ROLE_OPTIONS = ["jga", "animator", "volunteer", "student"];
const DOMAIN_OPTIONS = [
    "general", "sports", "cultural", "literary", "security",
    "stage_technical", "media", "hospitality", "finance",
];

const ROLE_COLORS: Record<string, string> = {
    ga: "#E8A020",
    jga: "#1A3C6E",
    animator: "#2A5494",
    volunteer: "#10B981",
    student: "#6B7280",
};

interface UserRow {
    _id: string;
    uid: string;
    name: string;
    email: string;
    role: string;
    domain: string;
    isActive: boolean;
    onboardingComplete: boolean;
    createdAt: string;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, getToken } = useAuth();
    const { isAdmin } = useRole();

    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [loading, setLoading] = useState(true);

    // Invite dialog state
    const [showInvite, setShowInvite] = useState(false);
    const [inviteName, setInviteName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("volunteer");
    const [inviteDomain, setInviteDomain] = useState("general");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string } | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const params = new URLSearchParams({ page: String(page), limit: "20" });
            if (search) params.set("search", search);
            if (roleFilter) params.set("role", roleFilter);

            const res = await fetch(`/api/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.data.users);
                setTotal(data.data.total);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, getToken]);

    useEffect(() => {
        if (isAdmin) fetchUsers();
    }, [isAdmin, fetchUsers]);

    // Redirect if not admin
    useEffect(() => {
        if (user && !isAdmin) router.replace("/dashboard");
    }, [user, isAdmin, router]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteResult(null);
        try {
            const token = await getToken();
            const res = await fetch("/api/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: inviteName,
                    email: inviteEmail,
                    role: inviteRole,
                    domain: inviteDomain,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setInviteResult({ success: true, message: "Invitation sent!" });
                setInviteName("");
                setInviteEmail("");
            } else {
                setInviteResult({ success: false, message: data.error });
            }
        } catch {
            setInviteResult({ success: false, message: "Failed to send invitation" });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleToggleActive = async (targetUser: UserRow) => {
        const token = await getToken();
        await fetch("/api/users", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                userId: targetUser._id,
                updates: { isActive: !targetUser.isActive },
            }),
        });
        fetchUsers();
    };

    if (!isAdmin) return null;

    return (
        <div style={{ padding: "8px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "#1A1A2E", margin: 0 }}>
                        User Management
                    </h1>
                    <p style={{ color: "#6B7280", fontSize: "14px", margin: "4px 0 0" }}>
                        {total} total users
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowInvite(true);
                        setInviteResult(null);
                    }}
                    style={{
                        padding: "10px 20px", borderRadius: "10px",
                        background: "linear-gradient(135deg, #E8A020 0%, #F0B84D 100%)",
                        color: "#1A1A2E", border: "none", cursor: "pointer",
                        fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-display)",
                    }}
                >
                    + Invite User
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by name or email..."
                    style={{
                        flex: 1, minWidth: "200px", padding: "10px 14px", borderRadius: "10px",
                        border: "1px solid #E2E8F0", fontSize: "14px", outline: "none",
                    }}
                />
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    style={{
                        padding: "10px 14px", borderRadius: "10px",
                        border: "1px solid #E2E8F0", fontSize: "14px", background: "white",
                    }}
                >
                    <option value="">All Roles</option>
                    {["ga", ...ROLE_OPTIONS].map((r) => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                        <tr style={{ background: "#F8F9FB" }}>
                            {["Name", "Email", "Role", "Domain", "Status", "Actions"].map((h) => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#1A1A2E", borderBottom: "1px solid #E2E8F0" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                                    Loading...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                    <td style={{ padding: "12px 16px", fontWeight: 500, color: "#1A1A2E" }}>{u.name}</td>
                                    <td style={{ padding: "12px 16px", color: "#6B7280" }}>{u.email}</td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{
                                            display: "inline-block", padding: "2px 10px", borderRadius: "6px",
                                            fontSize: "12px", fontWeight: 600, color: "white",
                                            background: ROLE_COLORS[u.role] || "#6B7280",
                                        }}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px", color: "#6B7280", textTransform: "capitalize" }}>
                                        {u.domain.replace("_", " ")}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{
                                            display: "inline-block", padding: "2px 8px", borderRadius: "6px",
                                            fontSize: "12px", fontWeight: 500,
                                            color: u.isActive ? "#10B981" : "#EF4444",
                                            background: u.isActive ? "#ECFDF5" : "#FEF2F2",
                                        }}>
                                            {u.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        {user?.role === "ga" && u.uid !== user.uid && (
                                            <button
                                                onClick={() => handleToggleActive(u)}
                                                style={{
                                                    padding: "4px 12px", borderRadius: "6px", fontSize: "12px",
                                                    border: "1px solid #E2E8F0", background: "white", cursor: "pointer",
                                                    color: u.isActive ? "#EF4444" : "#10B981",
                                                }}
                                            >
                                                {u.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        style={{
                            padding: "8px 16px", borderRadius: "8px", border: "1px solid #E2E8F0",
                            background: "white", cursor: page === 1 ? "not-allowed" : "pointer",
                            opacity: page === 1 ? 0.5 : 1, fontSize: "13px",
                        }}
                    >
                        Previous
                    </button>
                    <span style={{ padding: "8px 12px", fontSize: "13px", color: "#6B7280" }}>
                        Page {page} of {Math.ceil(total / 20)}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page * 20 >= total}
                        style={{
                            padding: "8px 16px", borderRadius: "8px", border: "1px solid #E2E8F0",
                            background: "white", cursor: page * 20 >= total ? "not-allowed" : "pointer",
                            opacity: page * 20 >= total ? 0.5 : 1, fontSize: "13px",
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Invite Dialog Overlay */}
            {showInvite && (
                <div
                    onClick={() => setShowInvite(false)}
                    style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000, padding: "24px",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "white", borderRadius: "16px", padding: "32px",
                            maxWidth: "440px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                        }}
                    >
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "#1A1A2E", marginBottom: "20px" }}>
                            Invite New User
                        </h2>

                        <form onSubmit={handleInvite}>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>Name</label>
                                <input
                                    type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                                    required placeholder="Full name"
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                                />
                            </div>
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>Email</label>
                                <input
                                    type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                                    required placeholder="email@college.edu"
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>Role</label>
                                    <select
                                        value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", background: "white" }}
                                    >
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1A1A2E", marginBottom: "6px" }}>Domain</label>
                                    <select
                                        value={inviteDomain} onChange={(e) => setInviteDomain(e.target.value)}
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", background: "white" }}
                                    >
                                        {DOMAIN_OPTIONS.map((d) => (
                                            <option key={d} value={d}>{d.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {inviteResult && (
                                <div style={{
                                    padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px",
                                    background: inviteResult.success ? "#ECFDF5" : "#FEE2E2",
                                    color: inviteResult.success ? "#10B981" : "#DC2626",
                                    border: `1px solid ${inviteResult.success ? "#A7F3D0" : "#FECACA"}`,
                                }}>
                                    {inviteResult.message}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowInvite(false)}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: "10px",
                                        background: "transparent", border: "1px solid #E2E8F0",
                                        color: "#6B7280", cursor: "pointer", fontSize: "14px",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: "10px",
                                        background: inviteLoading ? "#94A3B8" : "linear-gradient(135deg, #1A3C6E 0%, #2A5494 100%)",
                                        color: "white", border: "none",
                                        cursor: inviteLoading ? "not-allowed" : "pointer",
                                        fontSize: "14px", fontWeight: 600,
                                    }}
                                >
                                    {inviteLoading ? "Sending..." : "Send Invitation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
