"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
    const today = new Date();
    const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

    // Generate a simple calendar grid for the current month
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Calendar</h1>
                    <p className="text-muted-foreground">Event schedule and important dates.</p>
                </div>
                <Badge variant="secondary" className="self-start text-xs px-3 py-1">
                    🚧 Coming Soon
                </Badge>
            </div>

            <Card className="glass-heavy border-primary/10">
                <CardContent className="py-6">
                    {/* Month header */}
                    <div className="flex items-center justify-between mb-6">
                        <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors" disabled>
                            <ChevronLeft className="size-5" />
                        </button>
                        <h2 className="text-xl font-display font-bold text-foreground">{monthName}</h2>
                        <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors" disabled>
                            <ChevronRight className="size-5" />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((d) => (
                            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, i) => (
                            <div
                                key={i}
                                className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${day === today.getDate()
                                        ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                                        : day
                                            ? "text-foreground hover:bg-muted/30"
                                            : ""
                                    }`}
                            >
                                {day || ""}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-heavy border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CalendarIcon className="size-12 mb-4 opacity-30" />
                    <p className="text-lg font-display font-semibold mb-1">Calendar Module</p>
                    <p className="text-sm text-center max-w-md">
                        View scheduled events, deadlines, and important dates. Interactive calendar with event details.
                        Full functionality coming soon.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
