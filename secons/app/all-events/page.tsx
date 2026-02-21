"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, Search, Filter, ChevronLeft, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function AllEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDomain, setActiveDomain] = useState("all");

    useEffect(() => {
        fetch("/api/events?status=published&limit=50")
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setEvents(d.data.events);
                    setFilteredEvents(d.data.events);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let filtered = events.filter(ev =>
            ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (activeDomain !== "all") {
            filtered = filtered.filter(ev => ev.jgaDomain === activeDomain);
        }
        setFilteredEvents(filtered);
    }, [searchQuery, activeDomain, events]);

    const domains = ["all", "sports", "cultural", "literary", "general"];

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-primary transition-colors">
                        <ArrowLeft className="size-5" />
                        <span className="font-display font-black uppercase text-sm tracking-tighter">Back to Home</span>
                    </Link>
                    <div className="font-display font-black uppercase italic text-lg tracking-tighter">Event Directory</div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-12">
                {/* Search & Filters */}
                <div className="mb-12 space-y-6">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                        <Input
                            placeholder="Search events, categories..."
                            className="h-14 pl-12 rounded-2xl border-slate-200 shadow-sm text-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {domains.map(d => (
                            <Button
                                key={d}
                                variant={activeDomain === d ? "default" : "outline"}
                                onClick={() => setActiveDomain(d)}
                                className="rounded-full uppercase text-[10px] font-black tracking-widest px-6 h-9"
                            >
                                {d}
                            </Button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[400px] rounded-[2.5rem] bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredEvents.map((ev, i) => (
                            <motion.div
                                key={ev._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="h-full rounded-[2.5rem] border-slate-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden group flex flex-col">
                                    <div className="aspect-video relative overflow-hidden bg-slate-100 flex-shrink-0">
                                        {ev.flierUrl ? (
                                            <img src={ev.flierUrl} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-200"><CalendarDays className="size-20" /></div>
                                        )}
                                        <div className="absolute top-6 right-6 bg-white shadow-xl px-4 py-1.5 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest border border-slate-50">
                                            {ev.jgaDomain}
                                        </div>
                                    </div>
                                    <CardContent className="p-8 flex flex-col flex-grow">
                                        <Badge variant="outline" className="w-fit mb-4 text-[10px] uppercase font-black border-primary/20 bg-primary/5 text-primary tracking-widest px-3">
                                            {ev.category}
                                        </Badge>
                                        <h3 className="text-2xl font-display font-black text-slate-900 mb-4 uppercase italic tracking-tighter leading-none">{ev.title}</h3>
                                        <p className="text-slate-500 text-sm mb-6 line-clamp-3 font-medium">{ev.description}</p>

                                        <div className="mt-auto space-y-3">
                                            <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                                                <MapPin className="size-3 text-primary" /> {ev.venue}
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                                                <Clock className="size-3 text-primary" /> {format(new Date(ev.startDateTime), "MMM d, h:mm a")}
                                            </div>
                                        </div>

                                        {ev.registrationLink && (
                                            <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer" className="block mt-8">
                                                <Button className="w-full h-12 rounded-2xl bg-slate-900 text-white hover:bg-primary font-black uppercase tracking-widest text-[11px] transition-all">
                                                    Register Now
                                                </Button>
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center opacity-20 font-display font-black text-4xl uppercase italic">No events found.</div>
                )}
            </main>
        </div>
    );
}
