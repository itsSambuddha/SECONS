"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, History, Trophy, Search, Filter, ShieldCheck, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

interface Team {
    _id: string;
    name: string;
    group: string;
    semester: number;
    totalPoints: number;
    eventPoints: any[];
}

interface Event {
    _id: string;
    title: string;
    category: string;
}

export default function TeamsPage() {
    const { user, getToken } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Award Points Form State
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isAwardOpen, setIsAwardOpen] = useState(false);
    const [points, setPoints] = useState("0");
    const [position, setPosition] = useState("1");
    const [selectedEventId, setSelectedEventId] = useState("");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isGA = user?.role === "ga" || user?.role === "jga";

    const fetchData = useCallback(async () => {
        try {
            const token = await getToken();
            const [teamsRes, eventsRes] = await Promise.all([
                fetch("/api/sports/leaderboard", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/events", { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const teamsData = await teamsRes.json();
            const eventsData = await eventsRes.json();

            if (teamsData.success) setTeams(teamsData.data);
            if (eventsData.success) setEvents(eventsData.data);
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAwardPoints = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeam) return;
        setSubmitting(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/teams/${selectedTeam._id}/points`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    points: parseInt(points),
                    position: parseInt(position),
                    eventId: selectedEventId,
                    reason
                })
            });

            if (res.ok) {
                toast.success(`Awarded ${points} points to ${selectedTeam.name}`);
                setIsAwardOpen(false);
                setPoints("0");
                setPosition("1");
                setSelectedEventId("");
                setReason("");
                fetchData();
            } else {
                toast.error("Failed to award points");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.group.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up pb-[100px] lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Teams</h1>
                    <p className="text-muted-foreground">Manage all 18 participating groups.</p>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                        placeholder="Search teams..."
                        className="pl-9 bg-white/50 border-slate-200"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map(team => (
                        <Card key={team._id} className="glass-heavy border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                            <CardHeader className="pb-2 space-y-0">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="bg-primary/10 text-primary font-black uppercase text-[10px]">
                                        Semester {team.semester}
                                    </Badge>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-slate-900 leading-none">{team.totalPoints}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Points</p>
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-bold text-slate-800 mt-2">{team.name}</CardTitle>
                                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">{team.group}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 gap-2 text-xs border-slate-200 hover:bg-slate-50"
                                        onClick={() => {
                                            setSelectedTeam(team);
                                            // Handle view history (Optional: could be a separate dialog)
                                        }}
                                    >
                                        <History className="size-3.5" /> History
                                    </Button>

                                    {isGA && (
                                        <Button
                                            size="sm"
                                            className="flex-1 gap-2 text-xs bg-primary hover:bg-primary/90 text-white"
                                            onClick={() => {
                                                setSelectedTeam(team);
                                                setIsAwardOpen(true);
                                            }}
                                        >
                                            <Plus className="size-3.5" /> Award Points
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Award Points Dialog */}
            <Dialog open={isAwardOpen} onOpenChange={setIsAwardOpen}>
                <DialogContent className="sm:max-w-[425px] border-primary/20 bg-surface/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display font-bold">Award Points</DialogTitle>
                        <CardDescription>Give points to <b>{selectedTeam?.name}</b> for an event placement.</CardDescription>
                    </DialogHeader>

                    <form onSubmit={handleAwardPoints} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-tight">Points</label>
                                <Input
                                    type="number"
                                    value={points}
                                    onChange={e => setPoints(e.target.value)}
                                    required
                                    className="h-12 text-lg font-black text-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-tight">Position</label>
                                <Input
                                    type="number"
                                    value={position}
                                    onChange={e => setPosition(e.target.value)}
                                    required
                                    className="h-12 text-lg font-black"
                                    placeholder="e.g. 1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-tight">Select Event *</label>
                            <select
                                value={selectedEventId}
                                onChange={e => setSelectedEventId(e.target.value)}
                                required
                                className="w-full h-12 bg-white/50 border border-slate-200 rounded-xl px-3 outline-none focus:ring-2 focus:ring-primary/20 font-semibold text-sm"
                            >
                                <option value="">Choose an event...</option>
                                {events.map(ev => (
                                    <option key={ev._id} value={ev._id}>{ev.title} ({ev.category})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black uppercase tracking-tight">Reason / Note</label>
                            <Input
                                placeholder="e.g. Winner of Quiz Competition"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="h-12 bg-white/50"
                            />
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <p className="font-medium">Awarding points will immediately update the global leaderboard. This action is recorded in the team audit logs.</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="ghost" className="flex-1 h-12" onClick={() => setIsAwardOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting || !selectedEventId} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold">
                                {submitting ? "Awarding..." : "Confirm Award"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
