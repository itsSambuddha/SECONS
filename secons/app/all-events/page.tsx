"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CalendarDays, Search, MapPin, Clock, Tag, ExternalLink, Loader2, ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import Link from "next/link";

interface EventData {
    _id: string;
    title: string;
    category: string;
    description: string;
    venue: string;
    startDateTime: string;
    endDateTime: string;
    jgaDomain: string;
    registrationLink: string;
    flierUrl?: string;
    status: string;
}

interface CategoryData {
    _id: string;
    name: string;
    slug: string;
}

const DOMAINS = [
    { value: "general", label: "General" },
    { value: "sports", label: "Sports" },
    { value: "cultural", label: "Cultural" },
    { value: "literary", label: "Literary" },
    { value: "security", label: "Security" },
    { value: "stage_technical", label: "Stage & Technical" },
    { value: "media", label: "Media" },
    { value: "hospitality", label: "Hospitality" },
    { value: "finance", label: "Finance" },
];

export default function PublicEventsPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [domainFilter, setDomainFilter] = useState("all");
    const [dateSort, setDateSort] = useState("upcoming");

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "50" });
            if (categoryFilter !== "all") params.set("category", categoryFilter);
            if (domainFilter !== "all") params.set("domain", domainFilter);

            const res = await fetch(`/api/events?${params}`);
            const data = await res.json();
            if (data.success) setEvents(data.data.events);
        } catch {
            // silently fail for public page
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, domainFilter]);

    useEffect(() => {
        fetch("/api/events/categories")
            .then((r) => r.json())
            .then((d) => { if (d.success) setCategories(d.data.categories); })
            .catch(() => { });
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Filter and sort
    const filtered = events
        .filter((e) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
        })
        .sort((a, b) => {
            const da = new Date(a.startDateTime).getTime();
            const db = new Date(b.startDateTime).getTime();
            return dateSort === "upcoming" ? da - db : db - da;
        });

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mb-4">
                        <ArrowLeft className="size-4" /> Back to Home
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">All Events</h1>
                    <p className="text-muted-foreground mt-1">Discover all the exciting events at our festival</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 glass-heavy"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-44 glass-heavy"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={domainFilter} onValueChange={setDomainFilter}>
                        <SelectTrigger className="w-full sm:w-36 glass-heavy"><SelectValue placeholder="Domain" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Domains</SelectItem>
                            {DOMAINS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={dateSort} onValueChange={setDateSort}>
                        <SelectTrigger className="w-full sm:w-40 glass-heavy"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="upcoming">Upcoming First</SelectItem>
                            <SelectItem value="latest">Latest First</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground">
                        <Loader2 className="size-6 animate-spin mr-3" /> Loading events...
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="glass-heavy border-dashed border-primary/20">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <CalendarDays className="size-16 mb-4 opacity-30" />
                            <p className="text-xl font-display font-semibold mb-1">No Events Found</p>
                            <p className="text-sm">Check back soon for upcoming events!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((event) => {
                            const catName = categories.find((c) => c.slug === event.category)?.name || event.category;
                            return (
                                <Card key={event._id} className="glass-heavy border-primary/10 hover:shadow-glow transition-all group overflow-hidden flex flex-col">
                                    {/* Flyer */}
                                    {event.flierUrl ? (
                                        <div className="w-full h-48 overflow-hidden bg-muted">
                                            <img
                                                src={event.flierUrl}
                                                alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-32 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                                            <CalendarDays className="size-12 text-primary/20" />
                                        </div>
                                    )}

                                    <CardContent className="py-5 space-y-3 flex-1 flex flex-col">
                                        <h3 className="font-display font-bold text-foreground text-lg leading-tight line-clamp-2">
                                            {event.title}
                                        </h3>

                                        {/* Domain Pill */}
                                        <Badge className="self-start bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 rounded-full capitalize">
                                            {event.jgaDomain.replace(/_/g, " ")}
                                        </Badge>

                                        {/* Details */}
                                        <div className="space-y-2 text-sm text-muted-foreground flex-1">
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3.5 shrink-0" />
                                                <span>
                                                    {format(new Date(event.startDateTime), "MMM d, yyyy · h:mm a")}
                                                    {" → "}
                                                    {format(new Date(event.endDateTime), "h:mm a")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="size-3.5 shrink-0" />
                                                <span>{event.venue}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag className="size-3.5 shrink-0" />
                                                <span className="capitalize">{catName.replace(/_/g, " ")}</span>
                                            </div>
                                        </div>

                                        {/* Register */}
                                        {event.registrationLink && (
                                            <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                                                <Button className="w-full gap-2 bg-gradient-to-r from-primary to-primary-600 text-white text-sm h-9">
                                                    <ExternalLink className="size-4" /> Register Now
                                                </Button>
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Summary */}
                {!loading && filtered.length > 0 && (
                    <p className="text-center text-sm text-muted-foreground mt-8 pb-10">
                        Showing {filtered.length} event{filtered.length !== 1 ? "s" : ""}
                    </p>
                )}
            </div>
        </div>
    );
}
