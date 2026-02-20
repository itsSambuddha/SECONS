"use client";

import { MessageSquare, Users, Hash, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ChatPage() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Chat</h1>
                    <p className="text-muted-foreground">Real-time messaging and group channels.</p>
                </div>
                <Badge variant="secondary" className="self-start text-xs px-3 py-1">
                    🚧 Coming Soon
                </Badge>
            </div>

            <Card className="glass-heavy border-primary/10 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3">
                    {/* Sidebar preview */}
                    <div className="border-r border-border/50 p-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</p>
                        {["# general", "# sports-team", "# events", "# announcements"].map((ch) => (
                            <div
                                key={ch}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-sm text-muted-foreground"
                            >
                                <Hash className="size-4 opacity-50" />
                                <span>{ch.replace("# ", "")}</span>
                            </div>
                        ))}
                    </div>

                    {/* Chat area preview */}
                    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <MessageSquare className="size-12 mb-4 opacity-30" />
                        <p className="text-lg font-display font-semibold mb-1">Team Communication</p>
                        <p className="text-sm text-center max-w-sm">
                            Real-time messaging, group channels, and direct messages.
                            This module is currently under development.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
