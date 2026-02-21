"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Trophy, Activity, Timer, MapPin,
    TrendingUp, Users, ChevronRight,
    Flame, Zap, RefreshCw, BarChart3,
    Medal, History, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

/* ============================
   PUBLIC LIVE SCOREBOARD
   - Clean Glass Aesthetic
   - Real-time Syncing
   ============================ */

export default function LiveScoreboard() {
    const [matches, setMatches] = useState<any[]>([]);
    const [upcoming, setUpcoming] = useState<any>(null);
    const [standings, setStandings] = useState<any[]>([]);
    const [mvp, setMvp] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchLiveScores = useCallback(async () => {
        try {
            // 1. Fetch Live Matches
            const liveRes = await fetch("/api/sports/matches?status=live");
            const liveData = await liveRes.json();
            if (liveData.success) setMatches(liveData.data);

            // 2. Fetch Upcoming Match (Up Next)
            const upRes = await fetch("/api/sports/matches?status=scheduled");
            const upData = await upRes.json();
            if (upData.success && upData.data.length > 0) {
                setUpcoming(upData.data[0]);
            }

            // 3. Fetch Leaderboard
            const leadRes = await fetch("/api/sports/leaderboard");
            const leadData = await leadRes.json();
            if (leadData.success) setStandings(leadData.data);

            // 4. Fetch Latest MVP (from completed matches)
            const compRes = await fetch("/api/sports/matches?status=completed");
            const compData = await compRes.json();
            if (compData.success && compData.data.length > 0) {
                const latestMvpMatch = compData.data.find((m: any) => m.mvp);
                if (latestMvpMatch) setMvp(latestMvpMatch.mvp);
            }

            setLastUpdated(new Date());
        } catch (e) {
            console.error("Live Score Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLiveScores();
        const interval = setInterval(fetchLiveScores, 30000); // Polling every 30s for public page
        return () => clearInterval(interval);
    }, [fetchLiveScores]);

    return (
        <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-display selection:bg-primary/10 transition-colors">

            {/* Background Decor — Clean & Glassy */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-[1400px] mx-auto px-6 py-12 md:py-20 space-y-12">

                {/* Cinematic Header — Matching Command Center */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-mono text-[10px] uppercase tracking-widest px-4 py-1.5 bg-primary/5">
                                LIVE_CIRCUIT_NODE
                            </Badge>
                            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
                                <RefreshCw className="size-3 animate-spin" /> Next Sync in 15s
                            </div>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-primary-900">
                            Live Score<span className="text-primary italic font-light lowercase">.</span>
                        </h1>
                    </div>
                    <div className="text-right space-y-2">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Broadcast Status</p>
                        <div className="flex items-center gap-3 justify-end">
                            <span className="text-3xl font-black tracking-tighter uppercase">Operational</span>
                            <div className="size-3 rounded-full bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse" />
                        </div>
                    </div>
                </header>

                {/* Live Stage */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Active Circuits (8/12) */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-[0.4em]">Active Engagements</h3>
                            <Badge className="bg-slate-100 dark:bg-white/5 text-slate-500 rounded-full px-4">{matches.length} matches</Badge>
                        </div>

                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4">
                                <RefreshCw className="size-10 animate-spin text-primary opacity-20" />
                                <p className="text-xs font-mono uppercase tracking-widest">Syncing with Mainframe...</p>
                            </div>
                        ) : matches.length === 0 ? (
                            <div className="h-[400px] border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-white/40 dark:bg-white/[0.01]">
                                <div className="size-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
                                    <Activity className="size-8 text-slate-300" />
                                </div>
                                <h4 className="text-2xl font-black uppercase tracking-tight text-slate-400">Standby Mode</h4>
                                <p className="text-sm text-slate-500 font-light mt-2 max-w-xs">No matches are currently broadcasting live telemetry. Please check the upcoming circuit schedule.</p>
                            </div>
                        ) : (
                            <div className="grid gap-10">
                                {matches.map((match) => (
                                    <LiveMatchWidget key={match._id} match={match} />
                                ))}
                            </div>
                        )}

                        {/* UP NEXT FOOTER */}
                        {upcoming && (
                            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl p-8 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                                        <History className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Next Engagement</p>
                                        <p className="text-lg font-black uppercase tracking-tight">{upcoming.sportName}: {upcoming.roundName || "Qualifiers"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-slate-400">
                                    <span className="text-xs font-mono tracking-widest">
                                        {format(new Date(upcoming.scheduledAt), "hh:mm a")} • {upcoming.venue}
                                    </span>
                                    <ChevronRight className="size-5" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Standings Intelligence (4/12) */}
                    <aside className="lg:col-span-4 space-y-10">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-[0.4em]">Standings</h3>
                            <TrendingUp className="size-4 text-primary" />
                        </div>

                        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 backdrop-blur-3xl rounded-3xl p-8 space-y-8 shadow-sm">
                            {standings.length === 0 ? (
                                <p className="text-[10px] font-mono text-center text-muted-foreground py-10 uppercase">Data streams pending...</p>
                            ) : (
                                standings.map((team, i) => (
                                    <div key={team._id} className="space-y-3 p-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-mono text-muted-foreground uppercase">#{i + 1} • {team.name} ({team.group})</span>
                                            <span className="text-2xl font-black tracking-tighter">{team.totalPoints} <span className="text-[10px] font-light text-muted-foreground">PTS</span></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-1000", i === 0 ? "bg-primary" : "bg-slate-400")}
                                                style={{ width: `${Math.min((team.totalPoints / (standings[0]?.totalPoints || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* TOP PERFORMER BENTO */}
                        {mvp ? (
                            <Card className="rounded-3xl border-slate-200 dark:border-white/5 bg-gradient-to-br from-primary/10 to-transparent shadow-none">
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Star className="size-5 text-primary fill-primary/20" />
                                        <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-primary">Circuit MVP</h4>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <Users className="size-8 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black uppercase tracking-tight">{mvp.name}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                                                {mvp.teamId?.name || "Independent"} • {mvp.stats?.points || 0} POINTS
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="bg-slate-50 dark:bg-white/[0.01] border border-dashed border-slate-200 rounded-3xl p-8 text-center">
                                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">MVP Pending Broadcast</p>
                            </div>
                        )}
                    </aside>

                </div>

                {/* Technical Footer */}
                <footer className="pt-20 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between gap-6 opacity-30 group">
                    <div className="flex items-center gap-8 text-[9px] font-mono uppercase tracking-[0.4em]">
                        <span>Sync_ID: {lastUpdated.getTime()}</span>
                        <span>Protocol: SECONS_LIVE_v4</span>
                        <span>Freq: 15.000 Hz</span>
                    </div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-right">SECURE BROADCAST CHANNEL • NO UNAUTHORIZED RELAY</p>
                </footer>
            </div>
        </div>
    );
}

function LiveMatchWidget({ match }: any) {
    const isCricket = match.sportName?.toLowerCase() === "cricket";

    if (isCricket && match.cricketData) {
        return <CricketScoreboard match={match} data={match.cricketData} />;
    }

    return (
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[32px] p-10 relative group overflow-hidden hover:shadow-2xl transition-all duration-500 shadow-sm">
            <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-2">
                <span className="flex items-center gap-2 text-[10px] font-mono font-black text-primary uppercase tracking-[0.4em] animate-pulse">
                    <span className="size-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.6)]" /> Live Now
                </span>
                <Badge variant="outline" className="rounded-full text-[9px] text-muted-foreground uppercase tracking-widest px-3 border-slate-200">{match.roundName || "Qualifiers"}</Badge>
            </div>

            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Trophy className="size-3 text-primary" />
                    <span className="text-[10px] font-mono font-black text-primary uppercase tracking-widest leading-none">Global Circuit Engagement</span>
                </div>
                <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-slate-900 dark:text-gray leading-[0.8] drop-shadow-sm">
                    {match.sportName || "Circuit Live"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-light px-1 opacity-60">
                    <MapPin className="size-4" /> {match.venue} • {match.roundName || "Qualifiers"}
                </div>
            </div>

            <div className="flex items-center justify-between gap-12 py-4">
                <div className="flex-1 text-center md:text-right space-y-4">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{match.team1Id?.name || "Team A"}</p>
                    <h4 className="text-8xl md:text-[12rem] font-black tracking-[-0.05em] text-primary-900 drop-shadow-sm leading-none">{match.scoreTeam1}</h4>
                </div>

                <div className="flex flex-col items-center gap-6 opacity-10">
                    <span className="text-2xl font-black">X</span>
                    <div className="h-40 w-px bg-primary" />
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{match.team2Id?.name || "Team B"}</p>
                    <h4 className="text-8xl md:text-[12rem] font-black tracking-[-0.05em] text-primary-900 drop-shadow-sm leading-none">{match.scoreTeam2}</h4>
                </div>
            </div>

            <div className="flex items-center justify-between pt-10 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                        <Timer className="size-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Circuit Status</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">{match.status}</p>
                    </div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-3">
                    Broadcasting Telemetry <ChevronRight className="size-4 text-primary" />
                </div>
            </div>
        </div>
    );
}

function CricketScoreboard({ match, data }: { match: any, data: any }) {
    const currentTeam = data.innings === 1 ? match.team1Id : match.team2Id;
    const oppositeTeam = data.innings === 1 ? match.team2Id : match.team1Id;
    const currentStats = data.innings === 1 ? data.team1 : data.team2;

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Header Info */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Flame className="size-4 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-gray">Cricket Engagement</h4>
                        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{match.venue} • INNINGS {data.innings}</p>
                    </div>
                </div>
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary uppercase text-[9px] px-3 font-mono tracking-widest bg-primary/5">8-Over Circuit</Badge>
            </div>

            {/* Televised Style Banner */}
            <div className="relative overflow-hidden group">
                <div className="bg-[#1a365d] dark:bg-slate-900 rounded-2xl md:rounded-full h-auto md:h-24 flex flex-col md:flex-row items-stretch border border-white/10 shadow-2xl overflow-hidden">
                    {/* Main Score Bar (Left) */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-4 md:py-0 flex flex-col justify-center min-w-[280px] border-r border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="text-white/60 font-mono text-xs uppercase tracking-widest font-bold">{oppositeTeam.name.slice(0, 3)} v</span>
                            <span className="bg-white text-slate-900 px-2 py-0.5 rounded font-black text-lg tracking-tighter uppercase">{currentTeam.name.slice(0, 3)} {currentStats.runs}-{currentStats.wickets}</span>
                            <span className="text-white font-mono text-sm ml-2 font-bold">{currentStats.overs}.{currentStats.balls}</span>
                        </div>
                        {data.target && (
                            <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mt-0.5">TARGET <span className="text-white font-black">{data.target}</span></p>
                        )}
                    </div>

                    {/* Batting Stats (Center) */}
                    <div className="flex-1 bg-white/5 backdrop-blur-sm px-6 py-4 md:py-0 grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-r border-white/10">
                        <div className="flex items-center justify-between md:justify-start gap-4">
                            <span className="flex items-center gap-2">
                                <ChevronRight className="size-3 text-primary animate-ping" />
                                <span className="text-white font-black uppercase tracking-tight text-sm whitespace-nowrap">{data.batting.striker.name}</span>
                            </span>
                            <span className="text-white/90 font-mono text-sm font-bold ml-auto md:ml-0">
                                {data.batting.striker.runs} <span className="text-[10px] text-white/40">{data.batting.striker.balls}</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between md:justify-start gap-4">
                            <span className="text-white/40 font-black uppercase tracking-tight text-sm whitespace-nowrap pl-5">{data.batting.nonStriker.name}</span>
                            <span className="text-white/40 font-mono text-sm font-bold ml-auto md:ml-0">
                                {data.batting.nonStriker.runs} <span className="text-[10px] text-white/40">{data.batting.nonStriker.balls}</span>
                            </span>
                        </div>
                    </div>

                    {/* Bowling & This Over (Right) */}
                    <div className="flex-1 bg-white/[0.02] px-6 py-4 md:py-0 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="flex flex-col justify-center">
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">Current Bowler</p>
                            <div className="flex items-center justify-between">
                                <span className="text-white font-black uppercase text-sm">{data.bowling.name}</span>
                                <span className="text-blue-400 font-mono text-sm font-bold">
                                    {data.bowling.wickets}-{data.bowling.runs} <span className="text-[10px] text-white/30">{data.bowling.overs}.{data.bowling.balls}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-center">
                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">This Over</p>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {data.thisOver.length === 0 ? (
                                    <span className="text-[10px] font-mono text-white/20 italic">Awaiting first ball...</span>
                                ) : (
                                    data.thisOver.map((ball: string, idx: number) => (
                                        <span
                                            key={idx}
                                            className={cn(
                                                "size-6 flex items-center justify-center rounded text-[10px] font-black border uppercase shrink-0",
                                                ball === "W" ? "bg-red-500 border-red-400 text-white" :
                                                    (ball === "4" || ball === "6") ? "bg-primary border-primary/50 text-white shadow-glow" :
                                                        "bg-white/10 border-white/10 text-white/80"
                                            )}
                                        >
                                            {ball}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative End */}
                <div className="hidden md:block absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
