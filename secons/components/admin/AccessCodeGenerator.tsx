"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Plus, RefreshCw, Check, Share2, Tag, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

const ALLOWED_ROLES = [
    { value: "jga", label: "Joint General Animator (JGA)" },
    { value: "animator", label: "Animator" },
    { value: "volunteer", label: "Volunteer" },
    { value: "student", label: "Student" },
];

const GA_DOMAINS = [
    { value: "general", label: "General" },
    { value: "sports", label: "Sports" },
    { value: "cultural", label: "Cultural" },
    { value: "literary", label: "Literary" },
    { value: "security", label: "Security" },
    { value: "stage_technical", label: "Stage & Technical" },
    { value: "media", label: "Media" },
    { value: "hospitality", label: "Hospitality" },
    { value: "finance", label: "Finance" },
];

export function AccessCodeGenerator({ onSuccess }: { onSuccess?: () => void }) {
    const { user, getToken } = useAuth();
    const { isGA, isJGA } = useRole();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState("student");
    const [domain, setDomain] = useState("general");
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [codeData, setCodeData] = useState<{ role: string, domain: string } | null>(null);
    const [jgaDomains, setJgaDomains] = useState<{ value: string; label: string }[]>([]);
    const [domainsLoading, setDomainsLoading] = useState(false);

    // Only GA can invite JGAs/Animators? Check permissions.
    // Plan: GA invites all. JGA invites animator/volunteer/student.
    const availableRoles = ALLOWED_ROLES.filter(r => {
        if (isGA) return true;
        if (isJGA) return r.value !== "jga";
        return false; // Others cannot create invites
    });

    // Fetch event-based domains for JGA
    useEffect(() => {
        if (!isJGA) return;
        const fetchDomains = async () => {
            setDomainsLoading(true);
            try {
                const token = await getToken();
                const res = await fetch("/api/events/domains", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success && data.data.domains.length > 0) {
                    setJgaDomains(
                        data.data.domains.map((d: string) => ({
                            value: d,
                            label: d.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                        }))
                    );
                    setDomain(data.data.domains[0]);
                } else {
                    // Fallback: no events created yet, use GA domains
                    setJgaDomains(GA_DOMAINS);
                }
            } catch {
                setJgaDomains(GA_DOMAINS);
            } finally {
                setDomainsLoading(false);
            }
        };
        fetchDomains();
    }, [isJGA]);

    // GA uses hardcoded domains, JGA uses fetched domains
    const availableDomains = isGA ? GA_DOMAINS : jgaDomains;

    const handleGenerate = async () => {
        setLoading(true);
        setGeneratedCode(null);
        setCodeData(null);

        try {
            const token = await getToken();
            const res = await fetch("/api/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ role, domain }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to generate code");

            setGeneratedCode(data.code); // Assuming API returns raw code logic is updated to return code?
            // Wait, previous implementation hashed token and sent email.
            // The plan for Phase 1.5 says: "Generate Invite Card... Displays generated code".
            // So API needs to return the unhashed code if it's an Access Code system.
            // Phase 1 invitations used "random token -> hash". 
            // If I want to display it, I must return the raw token in the response of creation.
            // I need to verify /api/invitations implementation.

            setCodeData({ role, domain });
            toast.success("Access code generated successfully!");
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        toast.success("Code copied to clipboard");
    };

    const shareInvite = () => {
        if (!generatedCode) return;
        const url = `${window.location.origin}/login?code=${generatedCode}`;
        if (navigator.share) {
            navigator.share({
                title: 'Join SECONS',
                text: `Use access code ${generatedCode} to join SECONS as a ${codeData?.role}.`,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Invite link copied to clipboard");
        }
    };

    return (
        <Card className="w-full glass-heavy border-primary/10 shadow-glow relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <Tag className="size-24 text-primary" />
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-display text-primary dark:text-white">
                    <Plus className="size-5 text-accent" />
                    Generate Access Code
                </CardTitle>
                <CardDescription>
                    Create a new invitation code for team members.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="glass-heavy">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Domain</Label>
                        <Select value={domain} onValueChange={setDomain}>
                            <SelectTrigger className="glass-heavy">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableDomains.map((d) => (
                                    <SelectItem key={d.value} value={d.value}>
                                        {d.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {generatedCode && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in-up mt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">
                            Share this Code
                        </p>
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="text-3xl font-mono font-bold text-primary dark:text-white tracking-widest bg-white dark:bg-black/20 px-4 py-2 rounded-lg border border-dashed border-primary/30">
                                {generatedCode}
                            </div>
                        </div>
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                                <Copy className="size-4" /> Copy Code
                            </Button>
                            <Button size="sm" onClick={shareInvite} className="gap-2 bg-primary text-white hover:bg-primary-600">
                                <Share2 className="size-4" /> Share Link
                            </Button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground mt-3">
                            This code grants <strong>{codeData?.role}</strong> access to <strong>{codeData?.domain}</strong>.
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {!generatedCode && (
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg transition-all"
                    >
                        {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                        Generate Code
                    </Button>
                )}
                {generatedCode && (
                    <Button
                        variant="ghost"
                        onClick={() => { setGeneratedCode(null); }}
                        className="w-full text-muted-foreground hover:text-foreground"
                    >
                        Generate Another
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
