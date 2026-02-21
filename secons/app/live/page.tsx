"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Activity, ArrowLeft, Timer, MapPin, Star, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/layout/Footer";

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
    const pastMatches = matches.filter(m => m.status === "completed");

    return (
        <div className="min-h-screen bg-[#F8F9FB] text-slate-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors">
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
                                <div className="p-12 rounded-[2.5rem] bg-white border border-dashed border-slate-200 text-center opacity-30 font-display font-black uppercase text-xl italic text-slate-400">
                                    Searching for active signals...
                                </div>
                            )}
                        </section>

                        {/* Recent Finished */}
                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <Trophy className="size-6 text-amber-500" />
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

                            <Card className="rounded-[2.5rem] bg-white border-slate-100 shadow-xl overflow-hidden">
                                <div className="p-8 space-y-4">
                                    {leaderboard.slice(0, 10).map((team, idx) => (
                                        <div key={team._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-primary font-black opacity-50">#{idx + 1}</span>
                                                <div>
                                                    <p className="font-display font-black uppercase text-sm tracking-tight text-slate-900">{team.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono uppercase">Sem {team.semester} · {team.group}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-display font-black text-xl italic text-primary leading-none">{team.totalPoints}</p>
                                                <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-1">Pts</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
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
                isLive ? "bg-white border-primary/20 p-8 md:p-12 shadow-xl" : "bg-white border-slate-100 p-8 shadow-md"
            )}
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative z-10">

                {/* Team 1 */}
                <div className="flex-1 text-center md:text-right">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-2">Team A</p>
                    <h3 className="text-2xl md:text-3xl font-display font-black uppercase italic tracking-tighter leading-tight text-slate-900">{match.team1Id?.name}</h3>
                    <p className="text-[10px] text-primary font-bold uppercase mt-1">Sem {match.team1Id?.semester} · {match.team1Id?.group}</p>
                </div>

                {/* Score Center */}
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-6 md:gap-10">
                        <span className="text-5xl md:text-7xl font-display font-black italic tracking-tighter text-slate-900 tabular-nums">{match.scoreTeam1}</span>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-black text-slate-200 uppercase italic">VS</span>
                            <div className="h-8 w-[1px] bg-slate-100" />
                        </div>
                        <span className="text-5xl md:text-7xl font-display font-black italic tracking-tighter text-slate-900 tabular-nums">{match.scoreTeam2}</span>
                    </div>
                    <div className="mt-4">
                        {isLive ? (
                            <Badge className="bg-red-500 text-white font-black uppercase tracking-widest px-4 py-1.5 rounded-full animate-pulse text-[10px]">Signal Live</Badge>
                        ) : (
                            <Badge variant="outline" className="border-slate-200 text-slate-400 font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-[10px]">Final Protocol</Badge>
                        )}
                    </div>
                </div>

                {/* Team 2 */}
                <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-2">Team B</p>
                    <h3 className="text-2xl md:text-3xl font-display font-black uppercase italic tracking-tighter leading-tight text-slate-900">{match.team2Id?.name}</h3>
                    <p className="text-[10px] text-primary font-bold uppercase mt-1">Sem {match.team2Id?.semester} · {match.team2Id?.group}</p>
                </div>
            </div>

            {/* Footer Metadata */}
            <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap items-center justify-center md:justify-between gap-6 overflow-hidden">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Timer className="size-4 text-primary" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{match.sportName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{match.venue || "Stadium Circuit"}</span>
                    </div>
                </div>

                {match.mvp && (
                    <div className="px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                        <Star className="size-4 text-amber-500 fill-amber-500" />
                        <span className="font-display font-black uppercase text-[10px] text-amber-500 tracking-tighter">MVP: {match.mvp.name}</span>
                    </div>
                )}
            </div>

            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l ${isLive ? 'from-primary/5' : 'from-slate-50/50'} to-transparent pointer-events-none`} />
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r ${isLive ? 'from-primary/5' : 'from-slate-50/50'} to-transparent pointer-events-none`} />
        </motion.div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
