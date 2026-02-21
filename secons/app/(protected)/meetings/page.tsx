"use client";

import { useState, useEffect, useCallback } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Link2, Users, FileText, Plus, Trash2, Edit3, MessageCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

interface Meeting {
    _id: string;
    title: string;
    agenda?: string;
    scheduledAt: string;
    location: string;
    meetingLink?: string;
    attendeeGroups: string[];
    attendeeIds: string[];
    notes?: string;
    createdBy: {
        _id: string;
        name: string;
        role: string;
    };
}

export default function MeetingsPage() {
    const { user, getToken } = useAuth();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // Compose Form State
    const [title, setTitle] = useState("");
    const [agenda, setAgenda] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [location, setLocation] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [attendeeGroups, setAttendeeGroups] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const isGA = user?.role === "ga";

    const fetchMeetings = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch("/api/meetings", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMeetings(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load meetings");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = await getToken();
            const payload = {
                title,
                agenda,
                scheduledAt: new Date(scheduledAt).toISOString(),
                location,
                meetingLink,
                attendeeGroups: attendeeGroups.length > 0 ? attendeeGroups : ["all"],
            };

            const res = await fetch("/api/meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Meeting scheduled!");
                setIsComposeOpen(false);
                setTitle("");
                setAgenda("");
                setScheduledAt("");
                setLocation("");
                setMeetingLink("");
                setAttendeeGroups([]);
                fetchMeetings();
            } else {
                toast.error("Failed to schedule meeting");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Cancel this meeting? This will notify all attendees.")) return;
        try {
            const token = await getToken();
            const res = await fetch(`/api/meetings/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Meeting cancelled");
                setMeetings(prev => prev.filter(m => m._id !== id));
            }
        } catch (e) {
            toast.error("Failed to cancel");
        }
    };

    const toggleGroup = (g: string) => setAttendeeGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

    const upcomingMeetings = meetings.filter(m => !isPast(new Date(m.scheduledAt)));
    const pastMeetings = meetings.filter(m => isPast(new Date(m.scheduledAt)));

    return (
        <div className="space-y-6 animate-fade-in-up pb-[100px] lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Meetings</h1>
                    <p className="text-muted-foreground">Manage and track your secretariat schedule.</p>
                </div>

                {isGA && (
                    <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
                                <Plus className="size-4" /> Schedule Meeting
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-border/50 bg-surface/95 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl">Schedule a Meeting</DialogTitle>
                                <CardDescription>Set up a sync and invite specific teams.</CardDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreate} className="space-y-5 mt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title *</label>
                                    <Input
                                        placeholder="e.g. Weekly Secretariat Sync"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date & Time *</label>
                                        <Input
                                            type="datetime-local"
                                            value={scheduledAt}
                                            onChange={e => setScheduledAt(e.target.value)}
                                            required
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Location *</label>
                                        <Input
                                            placeholder="Room 404 or Virtual"
                                            value={location}
                                            onChange={e => setLocation(e.target.value)}
                                            required
                                            className="bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Virtual Meeting Link (Optional)</label>
                                    <Input
                                        type="url"
                                        placeholder="https://meet.google.com/..."
                                        value={meetingLink}
                                        onChange={e => setMeetingLink(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Agenda (Optional)</label>
                                    <textarea
                                        placeholder="What will be discussed?"
                                        value={agenda}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAgenda(e.target.value)}
                                        rows={3}
                                        className="flex w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    />
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/50">
                                    <p className="text-sm font-medium text-muted-foreground">Invite Groups</p>
                                    <div className="flex flex-wrap gap-2">
                                        {["all", "jga_all", "animator_all", "volunteer_all", "jga_sports", "animator_sports", "jga_literary", "animator_literary"].map(g => (
                                            <Badge
                                                key={g}
                                                variant={attendeeGroups.includes(g) ? "default" : "outline"}
                                                className="cursor-pointer capitalize"
                                                onClick={() => toggleGroup(g)}
                                            >
                                                {g.replace(/_/g, " ")}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400">If no groups are selected, it defaults to ALL.</p>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? "Scheduling..." : "Schedule Meeting"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            ) : meetings.length === 0 ? (
                <Card className="glass-heavy border-dashed border-primary/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <CalendarIcon className="size-16 mb-4 opacity-20" />
                        <p className="text-xl font-display font-semibold mb-1 text-slate-800">No Meetings</p>
                        <p className="text-sm text-center max-w-md">You have no upcoming or past meetings tracked in the system.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Upcoming */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold font-display text-slate-800 border-b pb-2">Upcoming ({upcomingMeetings.length})</h2>
                        {upcomingMeetings.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No upcoming meetings scheduled.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcomingMeetings.map(m => (
                                    <MeetingCard key={m._id} meeting={m} isGA={isGA} onDelete={handleDelete} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past */}
                    {pastMeetings.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold font-display text-slate-500 border-b pb-2">Past ({pastMeetings.length})</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                                {pastMeetings.map(m => (
                                    <MeetingCard key={m._id} meeting={m} isGA={isGA} onDelete={handleDelete} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MeetingCard({ meeting, isGA, onDelete }: { meeting: Meeting, isGA: boolean, onDelete: (id: string) => void }) {
    const isPastMeeting = isPast(new Date(meeting.scheduledAt));

    // Generate WhatsApp Invite Text
    const waText = encodeURIComponent(
        `*${meeting.title}*\n📅 ${format(new Date(meeting.scheduledAt), "PPP 'at' p")}\n📍 ${meeting.location}\n${meeting.meetingLink ? `🔗 ${meeting.meetingLink}\n` : ''}\nAgenda: ${meeting.agenda || 'TBD'}`
    );

    return (
        <Card className={`glass-heavy transition-all border-t-4 ${isPastMeeting ? 'border-t-slate-300' : 'border-t-primary shadow-sm hover:shadow-md'}`}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 leading-tight">{meeting.title}</h3>
                        <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                            <Clock className="size-3" />
                            {isPastMeeting ? "Completed" : formatDistanceToNow(new Date(meeting.scheduledAt), { addSuffix: true })}
                        </p>
                    </div>
                    {isGA && (
                        <div className="flex gap-1 ml-4 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => onDelete(meeting._id)}>
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-2 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="size-4 shrink-0 opacity-70" />
                        <span>{format(new Date(meeting.scheduledAt), "EEEE, MMMM do, yyyy • h:mm a")}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4 shrink-0 opacity-70" />
                            <span>{meeting.location}</span>
                        </div>
                        {meeting.meetingLink && (
                            <div className="flex items-center gap-2">
                                <Link2 className="size-4 shrink-0 opacity-70" />
                                <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="text-primary hover:underline max-w-[150px] truncate">
                                    {meeting.meetingLink}
                                </a>
                            </div>
                        )}
                    </div>
                    {meeting.agenda && (
                        <div className="flex items-start gap-2 pt-2 border-t mt-3">
                            <FileText className="size-4 shrink-0 opacity-70 mt-0.5" />
                            <p className="italic line-clamp-2">{meeting.agenda}</p>
                        </div>
                    )}
                </div>

                <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Users className="size-3.5" />
                        <span>{meeting.attendeeIds?.length || 0} Invited</span>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs h-7 gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                        asChild
                    >
                        <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer">
                            <MessageCircle className="size-3.5" /> Share WA
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
