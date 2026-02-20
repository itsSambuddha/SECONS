"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Loader2, Mail, Shield, UserCheck } from "lucide-react";
import { format } from "date-fns";

interface Member {
    _id: string;
    uid: string;
    name: string;
    email: string;
    role: string;
    domain: string;
    photoURL?: string;
    isActive: boolean;
    onboardingComplete: boolean;
    createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    ga: { label: "General Animator", color: "text-amber-700", bg: "bg-amber-100 border-amber-300" },
    jga: { label: "Joint GA", color: "text-blue-700", bg: "bg-blue-100 border-blue-300" },
    animator: { label: "Animator", color: "text-green-700", bg: "bg-green-100 border-green-300" },
    volunteer: { label: "Volunteer", color: "text-purple-700", bg: "bg-purple-100 border-purple-300" },
    student: { label: "Student", color: "text-gray-700", bg: "bg-gray-100 border-gray-300" },
};

export function MembersList() {
    const { getToken } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const fetchMembers = async () => {
        setLoading(true);
        setError("");
        try {
            const token = await getToken();
            const params = new URLSearchParams({ limit: "50" });
            if (search) params.set("search", search);

            const res = await fetch(`/api/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setMembers(data.data.users);
            } else {
                setError(data.error || "Failed to load members");
            }
        } catch {
            setError("Failed to fetch members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchMembers();
        }, 400);
        return () => clearTimeout(timeout);
    }, [search]);

    const getRoleConfig = (role: string) => ROLE_CONFIG[role] || ROLE_CONFIG.student;

    return (
        <Card className="glass-heavy border-primary/10 shadow-glow">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-display text-primary dark:text-white">
                    <Users className="size-5 text-accent" />
                    Team Members
                    {!loading && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                            {members.length} {members.length === 1 ? "member" : "members"}
                        </Badge>
                    )}
                </CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 glass-heavy"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="size-5 animate-spin mr-2" />
                        Loading members...
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-destructive text-sm">{error}</div>
                ) : members.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="size-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No members found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {members.map((member) => {
                            const rc = getRoleConfig(member.role);
                            return (
                                <div
                                    key={member._id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:bg-muted/30 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 overflow-hidden">
                                        {member.photoURL ? (
                                            <img
                                                src={member.photoURL}
                                                alt={member.name}
                                                className="size-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-bold text-primary">
                                                {member.name?.charAt(0)?.toUpperCase() || "?"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-foreground truncate">
                                                {member.name}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0 h-5 border ${rc.bg} ${rc.color}`}
                                            >
                                                {rc.label}
                                            </Badge>
                                            {member.isActive && (
                                                <span className="size-2 rounded-full bg-green-500 shrink-0" title="Active" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                <Mail className="size-3" />
                                                {member.email}
                                            </span>
                                            {member.domain !== "general" && (
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    · {member.domain.replace("_", " ")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Join Date */}
                                    <div className="hidden sm:block text-right shrink-0">
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Joined</div>
                                        <div className="text-xs text-foreground font-medium">
                                            {member.createdAt
                                                ? format(new Date(member.createdAt), "MMM d, yyyy")
                                                : "—"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
