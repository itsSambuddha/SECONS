"use client";

import { Megaphone, Bell, Pin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnnouncementsPage() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Announcements</h1>
                    <p className="text-muted-foreground">Important updates and notifications.</p>
                </div>
                <Badge variant="secondary" className="self-start text-xs px-3 py-1">
                    🚧 Coming Soon
                </Badge>
            </div>

            {/* Sample announcement cards */}
            <div className="space-y-4">
                {[
                    { title: "Welcome to SECONS", priority: "pinned", time: "Just now" },
                    { title: "Festival schedule will be released soon", priority: "normal", time: "Upcoming" },
                    { title: "Volunteer registration opens next week", priority: "normal", time: "Upcoming" },
                ].map((ann, i) => (
                    <Card key={i} className="glass-heavy border-primary/10 hover:shadow-glow transition-all opacity-50">
                        <CardContent className="flex items-center gap-4 py-4">
                            <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                {ann.priority === "pinned" ? (
                                    <Pin className="size-5 text-accent" />
                                ) : (
                                    <Bell className="size-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground">{ann.title}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Clock className="size-3" /> {ann.time}
                                </p>
                            </div>
                            {ann.priority === "pinned" && (
                                <Badge variant="outline" className="text-[10px] text-accent border-accent/30">
                                    Pinned
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="glass-heavy border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Megaphone className="size-12 mb-4 opacity-30" />
                    <p className="text-lg font-display font-semibold mb-1">Announcements Module</p>
                    <p className="text-sm text-center max-w-md">
                        Broadcast updates, pin important notices, and manage notifications.
                        This module is currently under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
