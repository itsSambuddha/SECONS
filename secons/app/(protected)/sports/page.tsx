"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Trophy, Medal, Timer, Users, Upload,
    Database, Activity, ChevronRight, Shield,
    Search, Filter, Plus, FileJson,
    LayoutGrid, List, AlertCircle, RefreshCw,
    CalendarDays, MapPin, Download, History,
    TrendingUp, Zap, Edit, Trash2, Check, X,
    Clock, MoreHorizontal, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger, DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

/* ============================
   TYPES & CONSTANTS
   ============================ */

interface MatchData {
    _id: string;
    sportName: string;
    team1Id: { _id: string; name: string; group: string; semester: number };
    team2Id: { _id: string; name: string; group: string; semester: number };
    scoreTeam1: number;
    scoreTeam2: number;
    status: "scheduled" | "live" | "completed" | "cancelled";
    venue: string;
    scheduledAt: string;
    roundName?: string;
    format: string;
    cricketData?: any;
}

interface TeamData {
    _id: string;
    name: string;
    group: string;
    semester: number;
}

const MATCH_STATUSES = [
    { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "live", label: "Live", color: "bg-red-100 text-red-700 border-red-200 animate-pulse" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
    { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const SPORT_IDENTITIES = [
    "Cricket",
    "Football",
    "Table Tennis",
    "Badminton",
    "Basketball",
    "Volleyball",
    "Chess",
    "Carrom",
    "E-Sports",
    "Athletics",
];

/* ============================
   SPORTS COMMAND CENTER
   - Highly functional UI
   - Clean "Events Page" aesthetic
   ============================ */

export default function SportsCommandCenter() {
    const { getToken } = useAuth();
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sportFilter, setSportFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("overview");

    // Factory seeding status
    const [seedingLoading, setSeedingLoading] = useState(false);

    const fetchMatches = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch("/api/sports/matches", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setMatches(data.data);
        } catch (e) {
            toast.error("Failed to load matches");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    const fetchTeams = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch("/api/teams/seed", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTeams(data.data);
        } catch (e) {
            console.error("Failed to load teams");
        }
    }, [getToken]);

    useEffect(() => {
        fetchMatches();
        fetchTeams();
    }, [fetchMatches, fetchTeams]);

    // Auto-status transition logic
    useEffect(() => {
        const checkTransitions = async () => {
            const now = new Date();
            const toUpdate = matches.filter(m =>
                m.status === "scheduled" &&
                new Date(m.scheduledAt) <= now
            );

            if (toUpdate.length === 0) return;

            const token = await getToken();
            for (const match of toUpdate) {
                try {
                    await fetch(`/api/sports/matches/${match._id}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: "live", note: "Auto-transitioned to Live" }),
                    });
                } catch (e) {
                    console.error("Auto-transition failed for match:", match._id);
                }
            }
            if (toUpdate.length > 0) fetchMatches();
        };

        const interval = setInterval(checkTransitions, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [matches, fetchMatches, getToken]);

    const runSeeding = async () => {
        setSeedingLoading(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/teams/seed", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Teams seeded successfully");
                fetchTeams();
            } else {
                toast.error(data.error || "Seeding failed");
            }
        } catch (e) {
            toast.error("Network error during seeding");
        } finally {
            setSeedingLoading(false);
        }
    };

    const deleteMatch = async (id: string) => {
        if (!confirm("Are you sure you want to delete this match?")) return;
        try {
            const token = await getToken();
            const res = await fetch(`/api/sports/matches/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Match deleted");
                fetchMatches();
            }
        } catch (e) {
            toast.error("Deletion failed");
        }
    };

    const filteredMatches = matches.filter(m => {
        const matchesSearch = !search ||
            m.sportName?.toLowerCase().includes(search.toLowerCase()) ||
            m.team1Id.name.toLowerCase().includes(search.toLowerCase()) ||
            m.team2Id.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || m.status === statusFilter;
        const matchesSport = sportFilter === "all" || m.sportName === sportFilter;
        return matchesSearch && matchesStatus && matchesSport;
    });

    return (
        <div className="space-y-8 pb-20 animate-fade-in-up">

            {/* Cinematic Header — Matching Events Page */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
                <div>
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tighter uppercase">Sports Command<span className="text-primary italic font-light lowercase">.</span></h1>
                    <p className="text-muted-foreground font-light mt-1">Orchestrate fixtures, live scoring, and results transition.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        asChild
                        className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5 h-10 px-6"
                    >
                        <Link href="/live" target="_blank">
                            <ExternalLink className="size-4" />
                            View Live
                        </Link>
                    </Button>
                    <BulkImportDialog onComplete={fetchMatches} />
                    <CreateMatchDialog teams={teams} onComplete={fetchMatches} fetchTeams={fetchTeams} runSeeding={runSeeding} />
                </div>
            </div>

            {/* Meta Stats — Tactical Bento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Zap} label="Active Circuits" value={matches.filter(m => m.status === "live").length} color="text-red-500" />
                <StatCard icon={CalendarDays} label="Upcoming" value={matches.filter(m => m.status === "scheduled").length} color="text-blue-500" />
                <StatCard icon={Check} label="Finalized" value={matches.filter(m => m.status === "completed").length} color="text-green-500" />
                <StatCard icon={Users} label="Total Nodes" value={teams.length} color="text-primary" />
            </div>

            {/* Operations Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 border border-border rounded-2xl backdrop-blur-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search sport, team, or venue..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 glass-heavy border-none shadow-none focus-visible:ring-1 ring-primary/20"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 glass-heavy border-none">
                        <Filter className="size-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                        <SelectItem value="all">All Status</SelectItem>
                        {MATCH_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={sportFilter} onValueChange={setSportFilter}>
                    <SelectTrigger className="w-full sm:w-44 glass-heavy border-none">
                        <Trophy className="size-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Sport Identity" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                        <SelectItem value="all">All Sports</SelectItem>
                        {SPORT_IDENTITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="h-6 w-px bg-border hidden sm:block mx-2" />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={runSeeding}
                    disabled={seedingLoading}
                    className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5 h-10 px-6 shrink-0"
                >
                    {seedingLoading ? <RefreshCw className="size-4 animate-spin" /> : <Database className="size-4" />}
                    Factory Seed
                </Button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="lg:col-span-3 flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                        <Loader2 className="size-10 animate-spin text-primary opacity-40" />
                        <p className="text-sm font-mono uppercase tracking-widest">Initializing Command Node...</p>
                    </div>
                ) : filteredMatches.length === 0 ? (
                    <div className="lg:col-span-3">
                        <Card className="glass-heavy border-dashed border-primary/20 bg-primary/[0.01]">
                            <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                                <Activity className="size-16 mb-6 opacity-10" />
                                <h3 className="text-xl font-display font-bold text-foreground">No Active Circuits</h3>
                                <p className="text-sm text-center max-w-sm font-light mt-2">Initialize your first match or run the Factory Seed to populate team nodes.</p>
                                <Button
                                    className="mt-8 rounded-full bg-primary text-white shadow-lg hover:scale-105 transition-all text-xs font-black uppercase tracking-widest px-8"
                                    onClick={() => (document.getElementById("create-match-trigger") as HTMLElement)?.click()}
                                >
                                    <Plus className="mr-2 size-4" /> Create First Match
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    filteredMatches.map(match => (
                        <MatchCard key={match._id} match={match} teams={teams} onUpdate={fetchMatches} onDelete={() => deleteMatch(match._id)} />
                    ))
                )}
            </div>
        </div>
    );
}

/* ============================
   SUB-COMPONENTS
   ============================ */

function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <Card className="glass-heavy border-border hover:border-primary/20 transition-all shadow-sm group">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
                    <p className="text-3xl font-display font-black tracking-tighter">{value}</p>
                </div>
                <div className={cn("p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 transition-transform group-hover:scale-110", color)}>
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    );
}

function MatchCard({ match, teams, onUpdate, onDelete }: { match: MatchData, teams: TeamData[], onUpdate: () => void, onDelete: () => void }) {
    const { getToken } = useAuth();
    const status = MATCH_STATUSES.find(s => s.value === match.status) || MATCH_STATUSES[0];

    const updateStatus = async (newStatus: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`/api/sports/matches/${match._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, note: `Manual transition to ${newStatus}` }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Match ${newStatus}`);
                onUpdate();
            }
        } catch (e) {
            toast.error("Status update failed");
        }
    };

    return (
        <Card className="glass-heavy border-border hover:shadow-glow transition-all flex flex-col group overflow-hidden">
            {/* Card Head */}
            <div className="p-6 pb-2 flex items-center justify-between">
                <Badge variant="outline" className={cn("text-[9px] font-mono uppercase font-black px-2 py-0 border", status.color)}>
                    {status.label}
                </Badge>
                <div className="flex items-center gap-1">
                    {/* Status Transitions (Only for Live/Scheduled) */}
                    {(match.status === "live" || match.status === "scheduled") && (
                        <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
                            <Button variant="ghost" size="icon" className="size-8 rounded-full text-green-600 hover:bg-green-50" onClick={() => updateStatus("completed")} title="Mark Completed">
                                <Check className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 rounded-full text-red-500 hover:bg-gray-50" onClick={() => updateStatus("cancelled")} title="Cancel Match">
                                <X className="size-4" />
                            </Button>
                        </div>
                    )}
                    <UpdateScoreDialog match={match} onComplete={onUpdate} />
                    <CreateMatchDialog
                        teams={teams}
                        onComplete={onUpdate}
                        fetchTeams={() => { }}
                        runSeeding={() => { }}
                        mode="edit"
                        matchToEdit={match}
                    />
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-red-50" onClick={onDelete}>
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            <CardContent className="p-6 pt-2 space-y-6 flex-1">
                <div className="space-y-2">
                    <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.3em] opacity-70">Sport Entity</p>
                    <h4 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tighter uppercase leading-none bg-gradient-to-r from-primary to-primary/40 bg-clip-text text-transparent">
                        {match.sportName || "Circuit Active"}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pt-1">
                        <MapPin className="size-3 text-primary/60" />
                        <span>{match.venue}</span>
                        <span className="opacity-30">•</span>
                        <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase">{match.roundName || "Qualifiers"}</span>
                    </div>
                </div>

                {/* Scorer Board */}
                <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <div className="flex-1 text-center space-y-2">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{match.team1Id.name}</p>
                        <p className="text-3xl font-display font-black tracking-tighter text-foreground">{match.scoreTeam1}</p>
                    </div>
                    <div className="px-4 text-[10px] font-mono font-bold text-slate-300">VS</div>
                    <div className="flex-1 text-center space-y-2">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{match.team2Id.name}</p>
                        <p className="text-3xl font-display font-black tracking-tighter text-foreground">{match.scoreTeam2}</p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase">
                        <Clock className="size-3" />
                        {format(new Date(match.scheduledAt), "MMM d, h:mm a")}
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-none px-2 rounded-full">
                        {match.format}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

/* ============================
   DIALOGS (MANAGEMENT)
   ============================ */

function CreateMatchDialog({ teams, onComplete, fetchTeams, runSeeding, mode = "create", matchToEdit }: {
    teams: TeamData[],
    onComplete: () => void,
    fetchTeams: () => void,
    runSeeding: () => void,
    mode?: "create" | "edit",
    matchToEdit?: MatchData
}) {
    const { getToken } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) fetchTeams();
    }, [open, fetchTeams]);

    const initialForm = {
        sportName: matchToEdit?.sportName || "",
        team1Id: matchToEdit?.team1Id._id || "",
        team2Id: matchToEdit?.team2Id._id || "",
        venue: matchToEdit?.venue || "",
        scheduledAt: matchToEdit?.scheduledAt ? format(new Date(matchToEdit.scheduledAt), "yyyy-MM-dd'T'HH:mm") : "",
        roundName: matchToEdit?.roundName || "",
        format: matchToEdit?.format || "standard",
    };

    const [form, setForm] = useState(initialForm);

    // Reset form when dialog opens/closes or matchToEdit changes
    useEffect(() => {
        if (open) {
            setForm(initialForm);
        }
    }, [open, matchToEdit]);

    const handleSubmit = async () => {
        if (!form.sportName || !form.team1Id || !form.team2Id || !form.venue || !form.scheduledAt) {
            toast.error("Please fill in all tactical fields.");
            return;
        }
        setLoading(true);
        try {
            const token = await getToken();
            const url = mode === "create" ? "/api/sports/matches" : `/api/sports/matches/${matchToEdit?._id}`;
            const method = mode === "create" ? "POST" : "PATCH";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(mode === "create" ? "Engagement initialized" : "Circuit updated");
                setOpen(false);
                onComplete();
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            toast.error("Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild id={mode === "create" ? "create-match-trigger" : undefined}>
                {mode === "create" ? (
                    <Button className="rounded-full bg-primary text-white hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest px-8 shadow-glow">
                        <Plus className="mr-2 size-4" /> Initialize Fixture
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5">
                        <Edit className="size-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glass-heavy border-primary/20 p-0">
                <DialogHeader className="p-8 pb-0">
                    <DialogTitle className="text-2xl font-display font-black tracking-tight uppercase">
                        {mode === "create" ? "Initialize Circuit" : "Update Circuit Parameters"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Define the tactical parameters for the upcoming engagement. Synchronized with 18 team nodes."
                            : `Adjusting parameters for ${matchToEdit?.sportName} engagement.`}
                    </DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Sport Identity</Label>
                            <Select value={form.sportName} onValueChange={v => setForm({ ...form, sportName: v })}>
                                <SelectTrigger className="glass-heavy w-full font-display font-black uppercase tracking-tight h-10"><SelectValue placeholder="Select Sport" /></SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    {SPORT_IDENTITIES.map(s => (
                                        <SelectItem key={s} value={s} className="font-display font-black uppercase text-xs">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Engagement Format</Label>
                            <Select value={form.format} onValueChange={v => setForm({ ...form, format: v })}>
                                <SelectTrigger className="glass-heavy w-full"><SelectValue /></SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    <SelectItem value="standard">Standard (Points)</SelectItem>
                                    <SelectItem value="heats">Heats (Timed/Ranked)</SelectItem>
                                    <SelectItem value="timed">Timed Trial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Blue Node (Team 1)</Label>
                            <Select value={form.team1Id} onValueChange={v => setForm({ ...form, team1Id: v })}>
                                <SelectTrigger className="glass-heavy w-full"><SelectValue placeholder="Select team" /></SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    {teams.length === 0 ? (
                                        <SelectItem value="none" disabled className="text-[10px] font-mono uppercase">
                                            No teams seeded. Run Factory Seed.
                                        </SelectItem>
                                    ) : (
                                        teams.map(t => (
                                            <SelectItem key={t._id} value={t._id}>
                                                {t.name} ({t.group})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Red Node (Team 2)</Label>
                            <Select value={form.team2Id} onValueChange={v => setForm({ ...form, team2Id: v })}>
                                <SelectTrigger className="glass-heavy w-full"><SelectValue placeholder="Select team" /></SelectTrigger>
                                <SelectContent position="popper" className="z-[100]">
                                    {teams.length === 0 ? (
                                        <SelectItem value="none" disabled className="text-[10px] font-mono uppercase">
                                            No teams seeded. Run Factory Seed.
                                        </SelectItem>
                                    ) : (
                                        teams.map(t => (
                                            <SelectItem key={t._id} value={t._id}>
                                                {t.name} ({t.group})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Venue Intelligence</Label>
                            <Input placeholder="Main Ground, Room 204..." value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="glass-heavy" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Scheduled Interval</Label>
                            <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="glass-heavy" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Circuit Phase (Round Name)</Label>
                        <Input placeholder="Pool A Match 1, Semi Finals..." value={form.roundName} onChange={e => setForm({ ...form, roundName: e.target.value })} className="glass-heavy" />
                    </div>
                </div>
                <DialogFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-border">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="rounded-full bg-primary text-xs font-black uppercase tracking-widest px-8 min-w-[140px]">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="mr-2 size-4" />}
                        Execute Sync
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UpdateScoreDialog({ match, onComplete }: { match: MatchData, onComplete: () => void }) {
    const { getToken } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scores, setScores] = useState({
        scoreTeam1: match.scoreTeam1,
        scoreTeam2: match.scoreTeam2,
        status: match.status,
        note: ""
    });

    const isCricket = match.sportName?.toLowerCase() === "cricket";

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/sports/matches/${match._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(scores),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Telemetry updated");
                setOpen(false);
                onComplete();
            }
        } catch (e) {
            toast.error("Sync failed");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusOverride = async (newStatus: string) => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/sports/matches/${match._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Broadcasting Terminal: Match ${newStatus}`);
                setOpen(false);
                onComplete();
            }
        } catch (e) {
            toast.error("Override failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-full border-primary text-primary hover:bg-primary hover:text-white px-4 font-mono text-[9px] uppercase font-black transition-colors">
                    Update Score
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] glass-heavy border-primary/20 p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-0">
                    <div className="flex justify-between items-start w-full">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-display font-black tracking-tight uppercase text-primary">
                                {(isCricket && match.status === "live") ? "Cricket Scorer Node" : "Precision Update"}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] leading-tight max-w-[200px]">
                                {(isCricket && match.status === "live") ? "Tactical ball-by-ball telemetry sync for 8-over circuit." : "Manually override scoring values for this circuit."}
                            </DialogDescription>
                        </div>

                        {match.status === "live" && (
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <Select onValueChange={handleStatusOverride}>
                                    <SelectTrigger className="w-[140px] h-9 rounded-xl bg-slate-900 text-white border-0 shadow-xl text-[9px] font-black tracking-widest uppercase focus:ring-0">
                                        <SelectValue placeholder="OVERRIDE" />
                                    </SelectTrigger>
                                    <SelectContent className="glass-heavy border-white/20">
                                        <SelectItem value="completed" className="text-green-500 font-bold uppercase text-[9px]">Mark Completed</SelectItem>
                                        <SelectItem value="cancelled" className="text-red-500 font-bold uppercase text-[9px]">Cancel Match</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Badge variant="outline" className="text-[8px] font-mono text-amber-500 border-amber-400 bg-amber-50 animate-pulse py-0 h-4 px-1.5">NODE: LIVE</Badge>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {(isCricket && match.status === "live") ? (
                    <CricketScorer match={match} onComplete={onComplete} setOpen={setOpen} />
                ) : (
                    <>
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between gap-6">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-mono text-muted-foreground uppercase text-center block w-full">{match.team1Id.name}</Label>
                                    <Input type="number" value={scores.scoreTeam1} onChange={e => setScores({ ...scores, scoreTeam1: parseInt(e.target.value) })} className="text-center text-3xl font-display font-black h-20 rounded-2xl glass-heavy" />
                                </div>
                                <div className="text-xl font-black text-slate-200">VS</div>
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-mono text-muted-foreground uppercase text-center block w-full">{match.team2Id.name}</Label>
                                    <Input type="number" value={scores.scoreTeam2} onChange={e => setScores({ ...scores, scoreTeam2: parseInt(e.target.value) })} className="text-center text-3xl font-display font-black h-20 rounded-2xl glass-heavy" />
                                </div>
                            </div>

                            {match.status !== "live" && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Circuit Status</Label>
                                    <Select value={scores.status} onValueChange={(v: any) => setScores({ ...scores, status: v })}>
                                        <SelectTrigger className="glass-heavy"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {MATCH_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Audit Note (Optional)</Label>
                                <Input placeholder="e.g. Scored a goal, foul penalty..." value={scores.note} onChange={e => setScores({ ...scores, note: e.target.value })} className="glass-heavy" />
                            </div>
                        </div>
                        <DialogFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-border">
                            <Button onClick={handleUpdate} disabled={loading} className="w-full h-12 rounded-full bg-primary font-black uppercase text-xs tracking-[0.2em]">
                                {loading ? <Loader2 className="size-4 animate-spin" /> : "Transmit Scoring"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CricketScorer({ match, onComplete, setOpen }: { match: MatchData, onComplete: () => void, setOpen: (v: boolean) => void }) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activePrompt, setActivePrompt] = useState<{ type: "toss" | "batsmen" | "bowler" | "wicket", names: Record<string, string> } | null>(null);

    // Initialize state from existing data or defaults
    const [data, setData] = useState(match.cricketData || {
        innings: 1,
        team1: { runs: 0, wickets: 0, overs: 0, balls: 0 },
        team2: { runs: 0, wickets: 0, overs: 0, balls: 0 },
        target: undefined,
        batting: {
            striker: { name: "Striker", runs: 0, balls: 0 },
            nonStriker: { name: "Non-Striker", runs: 0, balls: 0 }
        },
        bowling: { name: "Bowler", wickets: 0, runs: 0, overs: 0, balls: 0 },
        thisOver: [],
        toss: undefined
    });

    // Check for initialization prompts
    useEffect(() => {
        if (!data.toss) {
            setActivePrompt({
                type: "toss",
                names: { winner: "", decision: "" }
            });
        } else if (data.batting.striker.name === "Striker" && data.batting.nonStriker.name === "Non-Striker") {
            setActivePrompt({
                type: "batsmen",
                names: { striker: "", nonStriker: "" }
            });
        }
    }, [data.toss]);

    const isFirstInnings = data.innings === 1;
    const currentTeamStats = isFirstInnings ? data.team1 : data.team2;

    const handleAction = (type: string, value: number = 0) => {
        if (activePrompt) return; // Block while prompting

        const newData = JSON.parse(JSON.stringify(data));
        const stats = newData.innings === 1 ? newData.team1 : newData.team2;

        if (type === "run") {
            stats.runs += value;
            newData.batting.striker.runs += value;
            newData.batting.striker.balls += 1;
            newData.bowling.runs += value;
            newData.bowling.balls += 1;
            stats.balls += 1;
            newData.thisOver.push(value.toString());

            // Swap strikers on odd runs
            if (value % 2 !== 0) {
                const temp = newData.batting.striker;
                newData.batting.striker = newData.batting.nonStriker;
                newData.batting.nonStriker = temp;
            }
        } else if (type === "wicket") {
            stats.wickets += 1;
            stats.balls += 1;
            newData.batting.striker.balls += 1;
            newData.bowling.wickets += 1;
            newData.bowling.balls += 1;
            newData.thisOver.push("W");

            // Trigger Wicket Prompt
            setData(newData);
            setActivePrompt({ type: "wicket", names: { newBatter: "" } });
            return;
        } else if (type === "extra") {
            stats.runs += 1;
            newData.bowling.runs += 1;
            newData.thisOver.push(value === 0 ? "WD" : "NB");
            // Ball not counted for over
        }

        // Over Calculation (6 balls)
        if (stats.balls >= 6) {
            stats.overs += 1;
            stats.balls = 0;
            newData.bowling.overs += 1;
            newData.bowling.balls = 0;
            newData.thisOver = []; // Clear for next over
            // Swap strikers at end of over
            const temp = newData.batting.striker;
            newData.batting.striker = newData.batting.nonStriker;
            newData.batting.nonStriker = temp;

            // Trigger Bowler Prompt if match not finished
            const matchFinished = (newData.innings === 2 && (newData.team2.overs >= 8 || newData.team2.runs >= newData.target));
            if (!matchFinished) {
                setData(newData);
                setActivePrompt({ type: "bowler", names: { bowler: "" } });
                return;
            }
        }

        // Innings Transition (8 Overs)
        if (stats.overs >= 8 && newData.innings === 1) {
            newData.innings = 2;
            newData.target = stats.runs + 1;
            newData.thisOver = [];
            newData.bowling = { name: "Bowler", wickets: 0, runs: 0, overs: 0, balls: 0 };
            newData.batting = {
                striker: { name: "Striker", runs: 0, balls: 0 },
                nonStriker: { name: "Non-Striker", runs: 0, balls: 0 }
            };
            toast.success("1st Innings Complete. Target: " + newData.target);
            setData(newData);
            setActivePrompt({ type: "batsmen", names: { striker: "", nonStriker: "" } });
            return;
        }

        setData(newData);
    };

    const confirmPrompt = () => {
        if (!activePrompt) return;
        const newData = { ...data };

        if (activePrompt.type === "toss") {
            if (!activePrompt.names.winner || !activePrompt.names.decision) return;
            newData.toss = {
                winner: activePrompt.names.winner,
                decision: activePrompt.names.decision as "bat" | "bowl"
            };
            // No setActivePrompt(null) yet, move to batsmen if necessary
            setData(newData);
            // The useEffect will now trigger the batsmen prompt if needed
            setActivePrompt(null); // Clear current prompt
            return;
        } else if (activePrompt.type === "batsmen") {
            if (!activePrompt.names.striker || !activePrompt.names.nonStriker) return;
            newData.batting.striker.name = activePrompt.names.striker;
            newData.batting.nonStriker.name = activePrompt.names.nonStriker;
        } else if (activePrompt.type === "wicket") {
            if (!activePrompt.names.newBatter) return;
            newData.batting.striker = { name: activePrompt.names.newBatter, runs: 0, balls: 0 };
        } else if (activePrompt.type === "bowler") {
            if (!activePrompt.names.bowler) return;
            newData.bowling = { name: activePrompt.names.bowler, wickets: 0, runs: 0, overs: 0, balls: 0 };
        }

        setData(newData);
        setActivePrompt(null);
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/sports/matches/${match._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    cricketData: data,
                    scoreTeam1: data.team1.runs,
                    scoreTeam2: data.team2.runs,
                    status: (data.innings === 2 && (data.team2.overs >= 8 || (data.target && data.team2.runs >= data.target))) ? "completed" : "live"
                }),
            });
            const resData = await res.json();
            if (resData.success) {
                toast.success("Broadcast Updated");
                onComplete();
                setOpen(false);
            }
        } catch (e) {
            toast.error("Network Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8 bg-white/40 backdrop-blur-3xl min-h-[600px] flex flex-col justify-between">
            {/* iOS Dynamic Score Island */}
            <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Innings {data.innings} • {currentTeamStats === data.team1 ? match.team1Id.name : match.team2Id.name}</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                                    {currentTeamStats.runs}<span className="text-slate-300">/</span>{currentTeamStats.wickets}
                                </h2>
                            </div>
                        </div>
                        <div className="bg-slate-900 text-white rounded-2xl px-4 py-2 text-xl font-mono font-black shadow-lg">
                            {currentTeamStats.overs}.{currentTeamStats.balls}
                        </div>
                    </div>

                    {/* Minimalist Over Bar */}
                    <div className="flex gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        {data.thisOver.map((b: string, i: number) => (
                            <div key={i} className={cn(
                                "flex-1 transition-all duration-500",
                                b === "W" ? "bg-red-500" :
                                    (b === "4" || b === "6") ? "bg-primary" : "bg-slate-400"
                            )} />
                        ))}
                        {[...Array(Math.max(0, 6 - data.thisOver.length))].map((_, i) => (
                            <div key={i} className="flex-1 bg-slate-200/50" />
                        ))}
                    </div>
                    {data.target && (
                        <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                            Target: <span className="text-primary font-black">{data.target}</span> • Need <span className="text-slate-900 font-black">{data.target - data.team2.runs}</span> from <span className="text-slate-900 font-black">{(8 * 6) - (data.team2.overs * 6 + data.team2.balls)}</span> balls
                        </p>
                    )}
                </div>

                {/* Match Intelligence - iOS Control Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/40 shadow-sm flex flex-col justify-between min-h-[140px]">
                        <div>
                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                <Users className="size-4 text-primary" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">On Strike</p>
                            <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{data.batting.striker.name}</h4>
                        </div>
                        <p className="text-2xl font-mono font-black text-primary leading-none">
                            {data.batting.striker.runs}<span className="text-[10px] text-slate-400 ml-1">({data.batting.striker.balls})</span>
                        </p>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/40 shadow-sm flex flex-col justify-between min-h-[140px]">
                        <div>
                            <div className="size-8 rounded-xl bg-red-400/10 flex items-center justify-center mb-3">
                                <Activity className="size-4 text-red-500" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bowling</p>
                            <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{data.bowling.name}</h4>
                        </div>
                        <p className="text-2xl font-mono font-black text-red-500 leading-none">
                            {data.bowling.wickets}<span className="text-slate-300 mx-0.5">-</span>{data.bowling.runs}
                        </p>
                    </div>
                </div>
            </div>

            {/* iOS Action Dashboard */}
            <div className="space-y-6 relative">
                <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3, 4, 6].map(r => (
                        <button
                            key={r}
                            onClick={() => handleAction("run", r)}
                            disabled={!!activePrompt}
                            className="h-16 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm text-xl font-black text-slate-900 hover:bg-slate-50 active:scale-90 transition-all disabled:opacity-50"
                        >
                            {r}
                        </button>
                    ))}
                    <button
                        onClick={() => handleAction("wicket")}
                        disabled={!!activePrompt}
                        className="h-16 rounded-[1.5rem] bg-red-50 border border-red-100 shadow-sm text-xl font-black text-red-600 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                        W
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAction("extra", 0)} disabled={!!activePrompt} className="rounded-2xl bg-amber-50 text-[10px] font-black text-amber-600 border border-amber-100 active:scale-90 transition-all uppercase">WD</button>
                        <button onClick={() => handleAction("extra", 1)} disabled={!!activePrompt} className="rounded-2xl bg-amber-50 text-[10px] font-black text-amber-600 border border-amber-100 active:scale-90 transition-all uppercase">NB</button>
                    </div>
                </div>

                <Button
                    onClick={handleSync}
                    disabled={loading || !!activePrompt}
                    className="w-full h-16 rounded-[2rem] bg-slate-900 text-white shadow-2xl uppercase font-black tracking-[0.2em] text-xs hover:bg-slate-800 transition-all"
                >
                    {loading ? <RefreshCw className="size-5 animate-spin mr-2" /> : <Zap className="size-5 mr-2 fill-primary text-primary" />}
                    Sync Broadcast
                </Button>

                {/* iPhone Action Sheet Prompt Overlay */}
                {activePrompt && (
                    <div className="absolute inset-x-[-24px] bottom-[-24px] top-[-600px] z-[100] flex flex-col justify-end animate-in slide-in-from-bottom-full duration-500 ease-out">
                        <div className="bg-white/95 backdrop-blur-2xl rounded-t-[3rem] p-10 shadow-[0_-20px_80px_rgba(0,0,0,0.2)] border-t border-white/20">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                                    {activePrompt.type === "toss" ? "Toss Protocol" :
                                        activePrompt.type === "batsmen" ? "Telemetry Init" :
                                            activePrompt.type === "wicket" ? "Action Required" : "New Over"}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update Required to resume sync</p>
                            </div>

                            <div className="space-y-4">
                                {activePrompt.type === "toss" ? (
                                    <>
                                        <Select onValueChange={v => setActivePrompt({ ...activePrompt, names: { ...activePrompt.names, winner: v } })}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-bold">
                                                <SelectValue placeholder="Toss Winner" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={match.team1Id.name}>{match.team1Id.name}</SelectItem>
                                                <SelectItem value={match.team2Id.name}>{match.team2Id.name}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="grid grid-cols-2 gap-4">
                                            {["bat", "bowl"].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setActivePrompt({ ...activePrompt, names: { ...activePrompt.names, decision: d } })}
                                                    className={cn(
                                                        "h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border",
                                                        activePrompt.names.decision === d ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100"
                                                    )}
                                                >
                                                    Chose to {d}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : activePrompt.type === "batsmen" ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            placeholder="Striker"
                                            value={activePrompt.names.striker}
                                            onChange={e => setActivePrompt({ ...activePrompt, names: { ...activePrompt.names, striker: e.target.value } })}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-center font-bold uppercase"
                                        />
                                        <Input
                                            placeholder="Non-Striker"
                                            value={activePrompt.names.nonStriker}
                                            onChange={e => setActivePrompt({ ...activePrompt, names: { ...activePrompt.names, nonStriker: e.target.value } })}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-center font-bold uppercase"
                                        />
                                    </div>
                                ) : (
                                    <Input
                                        placeholder={activePrompt.type === "wicket" ? "New Batsman" : "Bowler Name"}
                                        value={activePrompt.names.newBatter || activePrompt.names.bowler}
                                        onChange={e => setActivePrompt({
                                            ...activePrompt,
                                            names: { ...activePrompt.names, [activePrompt.type === "wicket" ? 'newBatter' : 'bowler']: e.target.value }
                                        })}
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-center font-bold uppercase"
                                    />
                                )}
                                <Button onClick={confirmPrompt} className="w-full h-16 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest mt-6 shadow-xl">
                                    Update Telemetry
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function BulkImportDialog({ onComplete }: { onComplete: () => void }) {
    const { getToken } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [format, setFormat] = useState<"json" | "csv">("json");
    const [data, setData] = useState("");

    const handleImport = async () => {
        if (!data.trim()) {
            toast.error("Zero data detected in intake buffer.");
            return;
        }
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/sports/bulk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ type: "matches", format, data: data.trim() }),
            });
            const resData = await res.json();
            if (resData.success) {
                toast.success(`Ingested ${resData.data.success} entities successfully`);
                setOpen(false);
                onComplete();
            } else {
                toast.error(resData.error);
            }
        } catch (e) {
            toast.error("Ingest failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2 border-border shadow-sm h-10 px-6 font-display font-medium text-slate-700">
                    <Upload className="size-4" /> Bulk Ingest
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] glass-heavy border-primary/20 p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-0">
                    <DialogTitle className="text-2xl font-display font-black tracking-tight uppercase">Bulk Ingest Node</DialogTitle>
                    <DialogDescription>High-speed telemetry intake for matches, rosters, and circuits.</DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6">
                    <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-full border border-border w-fit">
                        <button onClick={() => setFormat("json")} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", format === "json" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}>JSON</button>
                        <button onClick={() => setFormat("csv")} className={cn("px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", format === "csv" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}>CSV</button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Data Buffer</Label>
                        <textarea
                            value={data}
                            onChange={e => setData(e.target.value)}
                            placeholder={format === "json" ? '[ { "sportName": "Football", "team1": "CSE", "team2": "ECE", ... } ]' : "sportName,team1,team2,venue,scheduledAt\nFootball,CSE,ECE,Main Field,2024-10-23T10:00"}
                            className="w-full h-64 p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-border font-mono text-xs focus:outline-none focus:ring-2 ring-primary/20 resize-none shadow-inner"
                        />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-[10px] text-amber-700 dark:text-amber-400">
                        <AlertCircle className="size-4 shrink-0" />
                        <p className="leading-relaxed">Ensure team names exactly match the Factory Seed identifiers. Incomplete data records will be purged during ingest.</p>
                    </div>
                </div>
                <DialogFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-border">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Abort</Button>
                    <Button onClick={handleImport} disabled={loading} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest px-10 min-w-[160px]">
                        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileJson className="size-4 mr-2" />}
                        Process Buffer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Loader2(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
        </svg>
    );
}
