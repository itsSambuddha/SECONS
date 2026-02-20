"use client";

import { Medal, TrendingUp, Award, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Leaderboard</h1>
                    <p className="text-muted-foreground">Team standings and points tracker.</p>
                </div>
                <Badge variant="secondary" className="self-start text-xs px-3 py-1">
                    🚧 Coming Soon
                </Badge>
            </div>

            {/* Placeholder podium */}
            <div className="flex items-end justify-center gap-4 py-12">
                {[
                    { place: "2nd", h: "h-28", color: "from-gray-300 to-gray-400" },
                    { place: "1st", h: "h-40", color: "from-amber-400 to-yellow-500" },
                    { place: "3rd", h: "h-20", color: "from-orange-300 to-orange-400" },
                ].map((p) => (
                    <div key={p.place} className="flex flex-col items-center gap-2">
                        <Crown className={`size-6 ${p.place === "1st" ? "text-amber-500" : "text-muted-foreground/30"}`} />
                        <div
                            className={`w-24 ${p.h} rounded-t-xl bg-gradient-to-b ${p.color} opacity-30 flex items-center justify-center`}
                        >
                            <span className="text-white font-display font-bold text-lg">{p.place}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Card className="glass-heavy border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Medal className="size-12 mb-4 opacity-30" />
                    <p className="text-lg font-display font-semibold mb-1">Points & Rankings</p>
                    <p className="text-sm text-center max-w-md">
                        View team standings, individual achievements, and point breakdowns.
                        This module is currently under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
