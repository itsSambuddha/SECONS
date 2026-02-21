"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    CalendarDays,
    Trophy,
    Banknote,
    Megaphone,
    ArrowRight,
    Zap,
    Star,
    Activity,
    Clock,
    Loader2,
    Plus,
    Video,
    Wind
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const { user, getToken } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch("/api/dashboard/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setStats(data.data);
        } catch (error) {
            toast.error("Telemetry failure");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000); // 1m refresh
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
                <Loader2 className="size-12 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-slate-400 font-black">Syncing Protocol...</p>
            </div>
        );
    }

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Morning";
        if (hour < 17) return "Afternoon";
        return "Evening";
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-16">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest">
                        Protocol: Dashboard / Status: Optimal
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter text-slate-900 uppercase italic leading-none">
                        Good {getTimeGreeting()}, <br />
                        <span className="text-primary italic">{user?.name?.split(' ')[0]}</span>.
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/breath">
                        <Button className="rounded-[1.5rem] h-14 px-8 bg-white border-2 border-slate-100 shadow-xl hover:bg-sky-50 transition-all text-slate-900 font-black uppercase tracking-widest text-[11px]">
                            <Wind className="size-5 mr-3 text-sky-400" />
                            Take a Breath
                        </Button>
                    </Link>
                    <Link href="/events">
                        <Button className="rounded-[1.5rem] h-14 px-8 shadow-2xl bg-slate-900 hover:bg-primary transition-all text-white font-black uppercase tracking-widest text-[11px]">
                            <Plus className="size-5 mr-3" />
                            Initiate Event
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <QuickActionNode
                    icon={CalendarDays}
                    label="Circuits Active"
                    value={stats?.counts?.totalEvents || 0}
                    href="/events"
                    color="text-indigo-500"
                />
                <QuickActionNode
                    icon={Trophy}
                    label="Live Telemetry"
                    value={stats?.counts?.activeMatches || 0}
                    href="/sports"
                    color="text-amber-500"
                    active={stats?.counts?.activeMatches > 0}
                />
                <QuickActionNode
                    icon={Banknote}
                    label="Flux Balance"
                    value={stats?.finance ? `₹${stats.finance.remaining.toLocaleString()}` : "Locked"}
                    href="/finance"
                    color="text-emerald-500"
                />
                <QuickActionNode
                    icon={Video}
                    label="Meetings Queue"
                    value="4"
                    href="/meetings"
                    color="text-pink-500"
                />
            </div>

            {/* Main Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: Feed */}
                <div className="lg:col-span-8 space-y-10">
                    <section>
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-display font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4">
                                <Megaphone className="size-8 text-primary" /> High Priority Feed
                            </h3>
                            <Link href="/announcements" className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all underline underline-offset-4">
                                Archive <ArrowRight className="size-4 inline ml-2" />
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {stats?.announcements?.length > 0 ? stats.announcements.map((a: any) => (
                                <Link key={a._id} href="/announcements">
                                    <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group flex flex-col md:flex-row gap-8 items-start">
                                        <div className="size-16 rounded-[2rem] bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-300 group-hover:text-primary transition-colors">
                                            <Zap className="size-8" />
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-display font-black text-2xl text-slate-900 uppercase italic leading-none group-hover:text-primary transition-all">{a.title}</h4>
                                                <span className="font-mono text-[9px] font-black p-2 bg-slate-50 rounded-xl text-slate-400 uppercase">{format(new Date(a.createdAt), 'HH:mm')}</span>
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-2">
                                                {a.body.replace(/<[^>]*>?/gm, '')}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <div className="size-8 rounded-2xl bg-slate-900 overflow-hidden shadow-xl">
                                                    {a.createdBy?.photoURL && <img src={a.createdBy.photoURL} alt="" className="size-full object-cover" />}
                                                </div>
                                                <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-widest">{a.createdBy?.name} / {a.createdBy?.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="py-24 text-center border-4 border-dashed border-slate-100 rounded-[3rem] opacity-20 font-display font-black text-4xl uppercase italic">Empty Signal</div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right: Telemetry Sidepanel */}
                <div className="lg:col-span-4 space-y-10">
                    <section>
                        <h3 className="text-3xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-10 flex items-center gap-4">
                            <Activity className="size-8 text-rose-500" /> Pulse
                        </h3>
                        <Card className="rounded-[3rem] bg-slate-900 p-8 text-white border-0 shadow-2xl relative overflow-hidden">
                            <div className="relative z-10 space-y-4">
                                {stats?.matches?.filter((m: any) => m.status === "live").map((match: any) => (
                                    <div key={match._id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all flex flex-col gap-6">
                                        <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase tracking-widest text-white/40">
                                            <span>{match.sportName}</span>
                                            <Badge className="bg-rose-500 text-white text-[8px] animate-pulse">Live Transmission</Badge>
                                        </div>
                                        <div className="flex justify-between items-center px-4">
                                            <div className="text-center">
                                                <p className="text-[9px] font-black uppercase text-white/40 mb-2">{match.team1Id.name}</p>
                                                <p className="text-4xl font-display font-black italic tracking-tighter">{match.scoreTeam1}</p>
                                            </div>
                                            <div className="h-10 w-px bg-white/10" />
                                            <div className="text-center">
                                                <p className="text-[9px] font-black uppercase text-white/40 mb-2">{match.team2Id.name}</p>
                                                <p className="text-4xl font-display font-black italic tracking-tighter">{match.scoreTeam2}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {stats?.matches?.filter((m: any) => m.status === "live").length === 0 && (
                                    <div className="py-20 text-center opacity-20 font-display font-black text-2xl uppercase italic">No Active Signal</div>
                                )}
                            </div>
                        </Card>
                    </section>

                    {/* Health Card */}
                    <section>
                        <h3 className="text-3xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-10 flex items-center gap-4">
                            <Star className="size-8 text-amber-400" /> Health
                        </h3>
                        <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl space-y-8">
                            <div className="flex items-center justify-between group">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/30">System integrity</span>
                                <span className="font-display font-black italic text-xl">100.0%</span>
                            </div>
                            <div className="flex items-center justify-between group">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/30">Sync latency</span>
                                <span className="font-display font-black italic text-xl text-primary">02ms</span>
                            </div>
                            <div className="flex items-center justify-between group">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/30">Circuit load</span>
                                <span className="font-display font-black italic text-xl">Optimal</span>
                            </div>
                            <div className="pt-8 border-t border-white/5 flex justify-center">
                                <Link href="/breath" className="text-sky-400 font-mono text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors">
                                    Refresh Biological Core
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function QuickActionNode({ icon: Icon, label, value, href, color, active = false }: any) {
    return (
        <Link href={href}>
            <div className="group h-48 bg-white/80 backdrop-blur-3xl rounded-[3rem] p-10 border border-slate-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 relative overflow-hidden flex flex-col justify-between active:scale-95">
                <div className={cn("size-14 rounded-[2rem] bg-white flex items-center justify-center shadow-2xl border border-slate-50 transition-all group-hover:scale-110", color)}>
                    <Icon className="size-6" />
                </div>
                <div>
                    <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-5xl font-display font-black text-slate-900 tracking-tighter italic uppercase">{value}</p>
                </div>
                {active && <div className="absolute top-8 right-8 size-3 bg-rose-500 rounded-full animate-ping" />}
            </div>
        </Link>
    );
}
