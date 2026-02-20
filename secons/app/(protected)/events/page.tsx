"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import {
    CalendarDays, Plus, Filter, Search, Loader2, Edit, Trash2, Upload,
    MapPin, Clock, Tag, X, Check, FileSpreadsheet, Image as ImageIcon,
    ExternalLink, AlertTriangle, Copy, FolderPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface EventData {
    _id: string;
    title: string;
    category: string;
    description: string;
    rules?: string;
    eligibility?: string;
    venue: string;
    startDateTime: string;
    endDateTime: string;
    jgaDomain: string;
    registrationLink: string;
    flierUrl?: string;
    status: string;
    participantCount: number;
    createdAt: string;
}

interface CategoryData {
    _id: string;
    name: string;
    slug: string;
    isDefault: boolean;
}

const STATUSES = [
    { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-700 border-gray-300" },
    { value: "published", label: "Published", color: "bg-green-100 text-green-700 border-green-300" },
    { value: "ongoing", label: "Ongoing", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "completed", label: "Completed", color: "bg-purple-100 text-purple-700 border-purple-300" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700 border-red-300" },
];

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

function getStatusConfig(status: string) {
    return STATUSES.find((s) => s.value === status) || STATUSES[0];
}

// ─── FLYER DROPZONE ───────────────────────────────────────────
function FlyerDropzone({
    flyerUrl,
    onUpload,
    uploading,
}: {
    flyerUrl: string;
    onUpload: (file: File) => void;
    uploading: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) onUpload(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${dragOver
                    ? "border-primary bg-primary/5"
                    : flyerUrl
                        ? "border-primary/30 bg-primary/5"
                        : "border-border hover:border-primary/40"
                }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleChange}
                className="hidden"
            />

            {uploading ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin mb-2 text-primary" />
                    <p className="text-sm font-medium">Uploading flyer...</p>
                </div>
            ) : flyerUrl ? (
                <div className="relative group">
                    <img src={flyerUrl} alt="Event flyer" className="w-full h-48 object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <p className="text-white text-sm font-medium">Click or drop to replace</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <ImageIcon className="size-10 mb-2 opacity-40" />
                    <p className="text-sm font-medium">Drop flyer image or click to upload</p>
                    <p className="text-xs mt-1 opacity-60">JPEG, PNG, WebP, GIF — max 5MB</p>
                </div>
            )}
        </div>
    );
}

// ─── MAIN EVENTS PAGE ─────────────────────────────────────────
export default function EventsPage() {
    const { getToken } = useAuth();
    const { isAdmin, isGA } = useRole();

    const [events, setEvents] = useState<EventData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [domainFilter, setDomainFilter] = useState("all");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showCsvPanel, setShowCsvPanel] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

    // Category management
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [addingCategory, setAddingCategory] = useState(false);

    // Create/edit form state
    const emptyForm = {
        title: "", category: "", description: "", rules: "", eligibility: "",
        venue: "", startDateTime: "", endDateTime: "", jgaDomain: "general",
        registrationLink: "", flierUrl: "", status: "draft",
    };
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [flyerUploading, setFlyerUploading] = useState(false);

    // CSV state
    const [csvData, setCsvData] = useState("");
    const [uploading, setUploading] = useState(false);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/events/categories");
            const data = await res.json();
            if (data.success) setCategories(data.data.categories);
        } catch { /* ignore */ }
    }, []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const params = new URLSearchParams({ limit: "50" });
            if (categoryFilter !== "all") params.set("category", categoryFilter);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (domainFilter !== "all") params.set("domain", domainFilter);

            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`/api/events?${params}`, { headers });
            const data = await res.json();
            if (data.success) setEvents(data.data.events);
        } catch {
            toast.error("Failed to load events");
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, statusFilter, domainFilter]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const filteredEvents = events.filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
    });

    // ─── ADD CATEGORY ─────
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setAddingCategory(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/events/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newCategoryName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Category "${newCategoryName.trim()}" added!`);
            setNewCategoryName("");
            setShowAddCategory(false);
            fetchCategories();
        } catch (err: any) {
            toast.error(err.message || "Failed to add category");
        } finally {
            setAddingCategory(false);
        }
    };

    // ─── DELETE CATEGORY ─────
    const handleDeleteCategory = async (slug: string, name: string) => {
        if (!confirm(`Delete category "${name}"? Events using this category won't be affected.`)) return;
        try {
            const token = await getToken();
            const res = await fetch("/api/events/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ slug }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Category deleted");
            fetchCategories();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    // ─── FLYER UPLOAD ─────
    const handleFlyerUpload = async (file: File) => {
        setFlyerUploading(true);
        try {
            const token = await getToken();
            const fd = new FormData();
            fd.append("flyer", file);
            const res = await fetch("/api/upload/flyer", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setForm((f) => ({ ...f, flierUrl: data.data.url }));
            toast.success("Flyer uploaded!");
        } catch (err: any) {
            toast.error(err.message || "Flyer upload failed");
        } finally {
            setFlyerUploading(false);
        }
    };

    // ─── CREATE ─────
    const handleCreate = async () => {
        if (!form.title || !form.category || !form.description || !form.venue || !form.startDateTime || !form.endDateTime || !form.registrationLink) {
            toast.error("Please fill in all required fields including registration link");
            return;
        }
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Event created!");
            setShowCreateForm(false);
            setForm(emptyForm);
            fetchEvents();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ─── UPDATE ─────
    const handleUpdate = async () => {
        if (!editingEvent) return;
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/events/${editingEvent._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Event updated!");
            setEditingEvent(null);
            setForm(emptyForm);
            fetchEvents();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    // ─── DELETE ─────
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
        try {
            const token = await getToken();
            const res = await fetch(`/api/events/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Event deleted");
            fetchEvents();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    // ─── CSV PASTE UPLOAD ─────
    const handleCsvUpload = async () => {
        if (!csvData.trim()) { toast.error("Please paste CSV data"); return; }
        setUploading(true);
        try {
            const lines = csvData.trim().split("\n");
            const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
            const rows = lines.slice(1).map((line) => {
                const values = line.split(",").map((v) => v.trim());
                const row: Record<string, string> = {};
                headers.forEach((h, i) => { row[h] = values[i] || ""; });
                return row;
            });

            const token = await getToken();
            const res = await fetch("/api/events/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ events: rows }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`${data.data.success} events imported, ${data.data.failed} failed`);
            setShowCsvPanel(false);
            setCsvData("");
            fetchEvents();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    };

    // ─── OPEN EDIT ─────
    const openEdit = (event: EventData) => {
        setEditingEvent(event);
        setShowCreateForm(false);
        setShowCsvPanel(false);
        setForm({
            title: event.title,
            category: event.category,
            description: event.description,
            rules: event.rules || "",
            eligibility: event.eligibility || "",
            venue: event.venue,
            startDateTime: event.startDateTime ? new Date(event.startDateTime).toISOString().slice(0, 16) : "",
            endDateTime: event.endDateTime ? new Date(event.endDateTime).toISOString().slice(0, 16) : "",
            jgaDomain: event.jgaDomain,
            registrationLink: event.registrationLink || "",
            flierUrl: event.flierUrl || "",
            status: event.status,
        });
    };

    // ─── EVENT FORM (shared for create & edit) ─────
    const renderForm = (isEdit: boolean) => (
        <Card className="glass-heavy border-primary/20 animate-fade-in-up">
            <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                    {isEdit ? <Edit className="size-5 text-accent" /> : <Plus className="size-5 text-accent" />}
                    {isEdit ? "Edit Event" : "Create New Event"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Flyer Dropzone */}
                <div className="space-y-2">
                    <Label>Event Flyer</Label>
                    <FlyerDropzone flyerUrl={form.flierUrl} onUpload={handleFlyerUpload} uploading={flyerUploading} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event name" className="glass-heavy" />
                    </div>
                    <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                            <SelectTrigger className="glass-heavy"><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description *</Label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event description..." className="w-full h-24 p-3 rounded-xl bg-background/50 border border-border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Rules</Label>
                        <Input value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Event rules (optional)" className="glass-heavy" />
                    </div>
                    <div className="space-y-2">
                        <Label>Eligibility</Label>
                        <Input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} placeholder="Who can participate? (optional)" className="glass-heavy" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Venue *</Label>
                        <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Location" className="glass-heavy" />
                    </div>
                    <div className="space-y-2">
                        <Label>Start *</Label>
                        <Input type="datetime-local" value={form.startDateTime} onChange={(e) => setForm({ ...form, startDateTime: e.target.value })} className="glass-heavy" />
                    </div>
                    <div className="space-y-2">
                        <Label>End *</Label>
                        <Input type="datetime-local" value={form.endDateTime} onChange={(e) => setForm({ ...form, endDateTime: e.target.value })} className="glass-heavy" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Domain *</Label>
                        <Select value={form.jgaDomain} onValueChange={(v) => setForm({ ...form, jgaDomain: v })}>
                            <SelectTrigger className="glass-heavy"><SelectValue /></SelectTrigger>
                            <SelectContent>{DOMAINS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                            <SelectTrigger className="glass-heavy"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Registration Link (Google Form) *</Label>
                        <Input value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} placeholder="https://forms.gle/..." className="glass-heavy" />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button onClick={isEdit ? handleUpdate : handleCreate} disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-primary-600 text-white">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        {saving ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
                    </Button>
                    <Button variant="ghost" onClick={() => { isEdit ? setEditingEvent(null) : setShowCreateForm(false); setForm(emptyForm); }}>
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Events</h1>
                    <p className="text-muted-foreground">
                        {isAdmin ? "Create and manage all festival events." : "Discover all festival events."}
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2 flex-wrap">
                        {isGA && (
                            <Button variant="outline" size="sm" onClick={() => { setShowCsvPanel(!showCsvPanel); setShowCreateForm(false); setEditingEvent(null); }} className="gap-2">
                                <Copy className="size-4" /> CSV Import
                            </Button>
                        )}
                        <Button size="sm" onClick={() => { setShowCreateForm(!showCreateForm); setShowCsvPanel(false); setEditingEvent(null); setForm(emptyForm); }} className="gap-2 bg-gradient-to-r from-primary to-primary-600 text-white">
                            <Plus className="size-4" /> Create Event
                        </Button>
                    </div>
                )}
            </div>

            {/* Category Management */}
            {isAdmin && (
                <Card className="glass-heavy border-primary/10">
                    <CardContent className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag className="size-4 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium text-muted-foreground shrink-0">Categories:</span>
                            {categories.map((cat) => (
                                <Badge key={cat.slug} variant="outline" className="text-xs gap-1 px-2.5 py-0.5">
                                    {cat.name}
                                    {!cat.isDefault && isGA && (
                                        <button onClick={() => handleDeleteCategory(cat.slug, cat.name)} className="ml-1 hover:text-destructive">
                                            <X className="size-3" />
                                        </button>
                                    )}
                                </Badge>
                            ))}
                            {showAddCategory ? (
                                <div className="flex items-center gap-1.5">
                                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category" className="h-7 w-32 text-xs glass-heavy" onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
                                    <Button size="sm" className="h-7 px-2" onClick={handleAddCategory} disabled={addingCategory}>
                                        {addingCategory ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}>
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setShowAddCategory(true)}>
                                    <FolderPlus className="size-3" /> Add
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* CSV Panel */}
            {showCsvPanel && isGA && (
                <Card className="glass-heavy border-accent/20 animate-fade-in-up">
                    <CardHeader>
                        <CardTitle className="text-lg font-display flex items-center gap-2">
                            <FileSpreadsheet className="size-5 text-accent" />
                            Bulk Import Events (Copy & Paste)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Copy & Paste Only</p>
                                <p>File upload is not supported in this version. Copy your CSV data from a spreadsheet and paste it below. Flyer images must be uploaded separately after event creation.</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Required CSV format (first row = headers):</Label>
                            <code className="block text-[11px] bg-muted px-3 py-2 rounded-lg overflow-x-auto">
                                title,category,description,venue,startDateTime,endDateTime,jgaDomain,registrationLink
                            </code>
                        </div>

                        <textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder={`title,category,description,venue,startDateTime,endDateTime,jgaDomain,registrationLink\nFootball Finals,sports,Championship match,Main Ground,2026-03-15T10:00,2026-03-15T12:00,sports,https://forms.gle/abc123`}
                            className="w-full h-40 p-3 rounded-xl bg-background/50 border border-border text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleCsvUpload} disabled={uploading} className="gap-2 bg-accent text-white hover:bg-accent/90">
                                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                                {uploading ? "Importing..." : "Import Events"}
                            </Button>
                            <Button variant="ghost" onClick={() => { setShowCsvPanel(false); setCsvData(""); }}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create / Edit Form */}
            {showCreateForm && isAdmin && renderForm(false)}
            {editingEvent && isAdmin && renderForm(true)}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 glass-heavy" />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-44 glass-heavy">
                        <Filter className="size-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Category" />
                    </SelectTrigger>
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
                {isAdmin && (
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-36 glass-heavy"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Events Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin mr-2" /> Loading events...
                </div>
            ) : filteredEvents.length === 0 ? (
                <Card className="glass-heavy border-dashed border-primary/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <CalendarDays className="size-12 mb-4 opacity-30" />
                        <p className="text-lg font-display font-semibold mb-1">No Events Found</p>
                        <p className="text-sm text-center max-w-md">
                            {isAdmin ? "Create your first event using the button above." : "No events have been published yet."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEvents.map((event) => {
                        const sc = getStatusConfig(event.status);
                        const catName = categories.find((c) => c.slug === event.category)?.name || event.category;
                        return (
                            <Card key={event._id} className="glass-heavy border-primary/10 hover:shadow-glow transition-all group overflow-hidden flex flex-col">
                                {/* Flyer */}
                                {event.flierUrl ? (
                                    <div className="w-full h-44 overflow-hidden bg-muted">
                                        <img src={event.flierUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                ) : (
                                    <div className="w-full h-28 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                                        <CalendarDays className="size-10 text-primary/20" />
                                    </div>
                                )}

                                <CardContent className="py-4 space-y-3 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-display font-bold text-foreground text-base leading-tight line-clamp-2">{event.title}</h3>
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border shrink-0 ${sc.color}`}>{sc.label}</Badge>
                                    </div>

                                    {/* Domain Pill */}
                                    <Badge className="self-start bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 rounded-full capitalize">
                                        {event.jgaDomain.replace(/_/g, " ")}
                                    </Badge>

                                    <div className="space-y-1.5 text-xs text-muted-foreground flex-1">
                                        <div className="flex items-center gap-2">
                                            <Tag className="size-3.5 shrink-0" />
                                            <span>{catName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-3.5 shrink-0" />
                                            <span className="truncate">{event.venue}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-3.5 shrink-0" />
                                            <span>
                                                {format(new Date(event.startDateTime), "MMM d, h:mm a")}
                                                {" → "}
                                                {format(new Date(event.endDateTime), "h:mm a")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                                            <Button size="sm" className="w-full gap-1.5 bg-gradient-to-r from-primary to-primary-600 text-white text-xs h-8">
                                                <ExternalLink className="size-3" /> Register
                                            </Button>
                                        </a>
                                        {isAdmin && (
                                            <>
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(event)} title="Edit">
                                                    <Edit className="size-3.5" />
                                                </Button>
                                                {isGA && (
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(event._id)} title="Delete">
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Summary Stats */}
            {!loading && events.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                    {categories.map((cat) => {
                        const count = events.filter((e) => e.category === cat.slug).length;
                        if (count === 0) return null;
                        return <Badge key={cat.slug} variant="outline" className="text-xs gap-1 px-3 py-1">{cat.name}: {count}</Badge>;
                    })}
                    <Badge variant="secondary" className="text-xs gap-1 px-3 py-1">Total: {events.length}</Badge>
                </div>
            )}
        </div>
    );
}
