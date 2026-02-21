"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Activity, ArrowLeft, Timer, MapPin, Star, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LiveScoreboardPage() {
    const [matches, setMatches] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [matchRes, boardRes] = await Promise.all([
                    fetch("/api/sports/matches"),
                    fetch("/api/sports/leaderboard")
                ]);
                const matchData = await matchRes.json();
                const boardData = await boardRes.json();

                if (matchData.success) setMatches(matchData.data);
                if (boardData.success) setLeaderboard(boardData.data);
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    const ongoingMatches = matches.filter(m => m.status === "live");
    const pastMatches = matches.filter(m => m.status === "finished");

    return (
        <div className="min-h-screen bg-[#0F172A] text-white">
            {/* Cinematic Header */}
            <header className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-primary transition-colors">
                        <ArrowLeft className="size-5" />
                        <span className="font-display font-black uppercase text-xs tracking-[0.2em]">Exit to Circuit</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                        <span className="font-display font-black uppercase italic text-2xl tracking-tighter">LIVE TELEMETRY</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left: Matches */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* Ongoing Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <Activity className="size-6 text-primary" />
                                <h2 className="font-display font-black text-3xl uppercase italic tracking-tighter">Live Operations</h2>
                            </div>

                            {ongoingMatches.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {ongoingMatches.map((m, i) => (
                                        <MatchCard key={m._id} match={m} isLive={true} />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 rounded-[2rem] border border-dashed border-white/10 text-center opacity-30 font-display font-black uppercase text-xl italic">
                                    Searching for active signals...
                                </div>
                            )}
                        </section>

                        {/* Recent Finished */}
                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <Trophy className="size-6 text-amber-400" />
                                <h2 className="font-display font-black text-3xl uppercase italic tracking-tighter">Recently Concluded</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {pastMatches.map((m) => (
                                    <MatchCard key={m._id} match={m} isLive={false} />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right: Leaderboard */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32">
                            <div className="flex items-center gap-3 mb-8">
                                <Star className="size-6 text-primary" />
                                <h2 className="font-display font-black text-3xl uppercase italic tracking-tighter">Leaderboard</h2>
                            </div>

                            <Card className="rounded-[2.5rem] bg-slate-900/50 border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
                                <div className="p-8 space-y-4">
                                    {leaderboard.slice(0, 10).map((team, idx) => (
                                        <div key={team._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-primary font-black opacity-50">#{idx + 1}</span>
                                                <div>
                                                    <p className="font-display font-black uppercase text-sm tracking-tight text-white">{team.name}</p>
                                                    <p className="text-[10px] text-white/40 font-mono uppercase">Sem {team.semester} · {team.group}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-display font-black text-xl italic text-primary leading-none">{team.totalPoints}</p>
                                                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mt-1">Pts</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function MatchCard({ match, isLive }: { match: any, isLive: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative overflow-hidden rounded-[2.5rem] border transition-all duration-500",
                isLive ? "bg-primary/10 border-primary/20 p-8 md:p-12 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]" : "bg-white/5 border-white/5 p-8"
            )}
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative z-10">

                {/* Team 1 */}
                <div className="flex-1 text-center md:text-right">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 mb-2">Team A</p>
                    <h3 className="text-2xl md:text-3xl font-display font-black uppercase italic tracking-tighter leading-tight">{match.team1Id?.name}</h3>
                    <p className="text-[10px] text-primary font-bold uppercase mt-1">Sem {match.team1Id?.semester} · {match.team1Id?.group}</p>
                </div>

                {/* Score Center */}
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-6 md:gap-10">
                        <span className="text-5xl md:text-7xl font-display font-black italic tracking-tighter text-white tabular-nums">{match.scoreTeam1}</span>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-black text-white/10 uppercase italic">VS</span>
                            <div className="h-8 w-[1px] bg-white/10" />
                        </div>
                        <span className="text-5xl md:text-7xl font-display font-black italic tracking-tighter text-white tabular-nums">{match.scoreTeam2}</span>
                    </div>
                    <div className="mt-4">
                        {isLive ? (
                            <Badge className="bg-red-500 text-white font-black uppercase tracking-widest px-4 py-1.5 rounded-full animate-pulse text-[10px]">Signal Live</Badge>
                        ) : (
                            <Badge variant="outline" className="border-white/20 text-white/40 font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-[10px]">Final Protocol</Badge>
                        )}
                    </div>
                </div>

                {/* Team 2 */}
                <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 mb-2">Team B</p>
                    <h3 className="text-2xl md:text-3xl font-display font-black uppercase italic tracking-tighter leading-tight">{match.team2Id?.name}</h3>
                    <p className="text-[10px] text-primary font-bold uppercase mt-1">Sem {match.team2Id?.semester} · {match.team2Id?.group}</p>
                </div>
            </div>

            {/* Footer Metadata */}
            <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap items-center justify-center md:justify-between gap-6 overflow-hidden">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Timer className="size-4 text-primary" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">{match.sportName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">{match.venue || "Stadium Circuit"}</span>
                    </div>
                </div>

                {match.mvp && (
                    <div className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center gap-3">
                        <Star className="size-4 text-amber-400 fill-amber-400" />
                        <span className="font-display font-black uppercase text-[10px] text-amber-400 tracking-tighter">MVP: {match.mvp.name}</span>
                    </div>
                )}
            </div>

            {/* Cinematic Background Gradient */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        </motion.div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
