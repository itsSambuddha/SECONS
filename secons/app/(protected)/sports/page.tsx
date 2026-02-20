"use client";

import { Trophy, Medal, Timer, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SportsPage() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Sports</h1>
                    <p className="text-muted-foreground">Fixtures, live scoring, and brackets.</p>
                </div>
                <Badge variant="secondary" className="self-start text-xs px-3 py-1">
                    🚧 Coming Soon
                </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Trophy, label: "Fixtures", desc: "Tournament brackets & matchups" },
                    { icon: Timer, label: "Live Scores", desc: "Real-time scoring updates" },
                    { icon: Users, label: "Teams", desc: "Team rosters & standings" },
                    { icon: Medal, label: "Results", desc: "Match results & history" },
                ].map((item) => (
                    <Card key={item.label} className="glass-heavy border-primary/10 hover:shadow-glow transition-all">
                        <CardContent className="flex flex-col items-center text-center py-8">
                            <item.icon className="size-10 text-accent mb-3 opacity-60" />
                            <p className="font-display font-semibold text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="glass-heavy border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Trophy className="size-12 mb-4 opacity-30" />
                    <p className="text-lg font-display font-semibold mb-1">Sports Module</p>
                    <p className="text-sm text-center max-w-md">
                        Manage fixtures, live scoring, bracket views, and team standings.
                        This module is currently under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
