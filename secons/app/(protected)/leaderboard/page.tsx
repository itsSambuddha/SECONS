"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Medal, Star, Filter, ArrowUp, ArrowDown, History, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

interface TeamPointEntry {
    eventId: string;
    points: number;
    position: number;
    awardedAt: string;
    awardedBy: string;
    reason?: string;
}

interface Team {
    _id: string;
    name: string;
    group: string;
    semester: number;
    totalPoints: number;
    eventPoints: TeamPointEntry[];
}

export default function LeaderboardPage() {
    const { getToken } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSemester, setSelectedSemester] = useState<string>("all");

    const fetchLeaderboard = useCallback(async (sem: string) => {
        setLoading(true);
        try {
            const token = await getToken();
            const url = sem === "all" ? "/api/sports/leaderboard" : `/api/sports/leaderboard?semester=${sem}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTeams(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchLeaderboard(selectedSemester);
    }, [selectedSemester, fetchLeaderboard]);

    const topTeams = teams.slice(0, 3);
    const otherTeams = teams.slice(3);

    return (
        <div className="space-y-8 animate-fade-in-up pb-[100px] lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Scoreboard</h1>
                    <p className="text-muted-foreground">The overall standings of SECONS Festival.</p>
                </div>

                <Tabs defaultValue="all" onValueChange={setSelectedSemester} className="bg-slate-100/50 p-1 rounded-xl glass-heavy border">
                    <TabsList className="bg-transparent border-0">
                        <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">All Groups</TabsTrigger>
                        <TabsTrigger value="2" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">2nd Sem</TabsTrigger>
                        <TabsTrigger value="4" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">4th Sem</TabsTrigger>
                        <TabsTrigger value="6" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">6th Sem</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : teams.length === 0 ? (
                <Card className="glass-heavy border-dashed">
                    <CardContent className="py-20 flex flex-col items-center text-muted-foreground">
                        <Trophy className="size-16 mb-4 opacity-10" />
                        <p className="text-xl font-display font-bold">No points awarded yet.</p>
                        <p className="text-sm">The festival rankings will start appearing once matches are completed.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-12">
                    {/* Podium Section */}
                    {topTeams.length > 0 && (
                        <div className="flex flex-col md:flex-row items-end justify-center gap-4 lg:gap-8 pt-10 px-4">
                            {/* 2nd Place */}
                            {topTeams[1] && (
                                <div className="flex-1 max-w-[280px] w-full order-2 md:order-1 flex flex-col items-center">
                                    <div className="relative mb-4">
                                        <div className="size-20 bg-slate-200 border-4 border-white flex items-center justify-center rounded-2xl shadow-lg transform -rotate-6">
                                            <span className="text-2xl font-black text-slate-500">2</span>
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-slate-500 text-white rounded-full p-1 shadow-md">
                                            <Medal className="size-4" />
                                        </div>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-t-3xl w-full h-32 p-6 text-center flex flex-col justify-center shadow-sm">
                                        <h3 className="font-bold text-slate-800 truncate">{topTeams[1].name}</h3>
                                        <p className="text-2xl font-black text-primary mt-1">{topTeams[1].totalPoints}</p>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {topTeams[0] && (
                                <div className="flex-1 max-w-[320px] w-full order-1 md:order-2 flex flex-col items-center z-10">
                                    <div className="relative mb-6">
                                        <div className="size-28 bg-gradient-to-br from-amber-300 to-amber-500 border-4 border-white flex items-center justify-center rounded-3xl shadow-xl animate-bounce-slow">
                                            <Trophy className="size-12 text-white" />
                                        </div>
                                        <div className="absolute -top-4 -right-4 bg-amber-400 text-white rounded-full p-2 shadow-lg border-2 border-white">
                                            <Star className="size-5 fill-white" />
                                        </div>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-lg border-4 border-amber-300/30 rounded-t-3xl w-full h-44 p-8 text-center flex flex-col justify-center shadow-xl">
                                        <p className="text-amber-600 text-sm font-black uppercase tracking-widest mb-1">Champions</p>
                                        <h3 className="font-display text-2xl font-black text-slate-950 truncate leading-tight">{topTeams[0].name}</h3>
                                        <p className="text-4xl font-black text-primary mt-2">{topTeams[0].totalPoints}</p>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {topTeams[2] && (
                                <div className="flex-1 max-w-[280px] w-full order-3 flex flex-col items-center">
                                    <div className="relative mb-4">
                                        <div className="size-16 bg-orange-100 border-4 border-white flex items-center justify-center rounded-2xl shadow-lg transform rotate-6">
                                            <span className="text-xl font-black text-orange-600">3</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 backdrop-blur-sm border border-orange-100 rounded-t-3xl w-full h-24 p-6 text-center flex flex-col justify-center shadow-sm">
                                        <h3 className="font-bold text-slate-800 truncate">{topTeams[2].name}</h3>
                                        <p className="text-xl font-black text-primary mt-1">{topTeams[2].totalPoints}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rankings Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-4 text-xs font-black uppercase tracking-widest text-slate-400">
                            <span>Rank & Team</span>
                            <span>Score</span>
                        </div>

                        <div className="grid gap-3">
                            {teams.map((team, index) => (
                                <Card key={team._id} className={`glass-heavy overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg ${index < 3 ? 'border-primary/20 bg-primary/5' : 'border-border/50'}`}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-xl flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' :
                                                    index === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-100' :
                                                        index === 2 ? 'bg-orange-300 text-white shadow-lg shadow-orange-100' :
                                                            'bg-slate-100 text-slate-400'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 leading-tight">{team.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-black px-1.5 py-0 border-primary/20 text-primary">
                                                        {team.group}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Sem {team.semester}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-primary leading-none">{team.totalPoints}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Points</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
