"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Bell,
  Pin,
  Clock,
  Plus,
  Trash2,
  Check,
  User as UserIcon,
  Filter,
  X,
  Info,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  targetRoles: string[];
  targetDomains: string[];
  pinned: boolean;
  createdBy: {
    _id: string;
    name: string;
    role: string;
    photoURL?: string;
  };
  readBy: string[];
  createdAt: string;
  isReadByMe: boolean;
}

export default function AnnouncementsPage() {
  const { user, getToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Compose State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetDomains, setTargetDomains] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isManager = user?.role === "ga" || user?.role === "jga";
  const isGA = user?.role === "ga";

  const fetchAnnouncements = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data.announcements);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Handle marking as read automatically on scroll/view (simplified to click for now)
  const handleMarkRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;
    try {
      const token = await getToken();
      await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "mark_read" }),
      });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                isReadByMe: true,
                readBy: [...a.readBy, user!.uid],
              }
            : a
        )
      );
    } catch (e) {
      console.error("Failed to mark read");
    }
  };

  const handlePin = async (id: string, currentlyPinned: boolean) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "update", pinned: !currentlyPinned }),
      });
      if (res.ok) {
        toast.success(currentlyPinned ? "Unpinned" : "Pinned");
        fetchAnnouncements();
      }
    } catch (e) {
      toast.error("Failed to update pin status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Deleted successfully");
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        title,
        content,
        targetRoles:
          user?.role === "ga" ? targetRoles : ["animator", "volunteer"], // JGA force
        targetDomains: user?.role === "ga" ? targetDomains : [user?.domain], // JGA force
        pinned: user?.role === "ga" ? pinned : false,
      };

      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Broadcast successful!");
        setIsComposeOpen(false);
        setTitle("");
        setContent("");
        setTargetRoles([]);
        setTargetDomains([]);
        setPinned(false);
        fetchAnnouncements();
      } else {
        toast.error("Failed to create announcement");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = (r: string) =>
    setTargetRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  const toggleDomain = (d: string) =>
    setTargetDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  return (
    <div className="space-y-6 animate-fade-in-up pb-[100px] lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Announcements
          </h1>
          <p className="text-muted-foreground">
            Important updates and notifications from the secretariat.
          </p>
        </div>

        {isManager && (
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary-600 text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:brightness-105 transition-all">
                <Plus className="size-4" /> New Broadcast
              </Button>
            </DialogTrigger>

            {/* UPDATED UI: Clean, Light Mode Form */}
            <DialogContent className="sm:max-w-[640px] border-slate-200 bg-white shadow-2xl p-0 overflow-hidden rounded-2xl">
<DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-white">
                <DialogTitle className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm border border-primary/20">
                    <Megaphone className="size-5" />
                  </span>
                  <div>
                    <p className="text-lg font-bold text-slate-900 tracking-tight">
                      Create Announcement
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      Broadcast a message to specific teams or everyone.
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 py-6 bg-slate-50/50">
                <form onSubmit={handleCreate} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Title<span className="text-red-500"> *</span>
                    </Label>
                    <Input
                      placeholder="e.g. Festival schedule update"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="h-11 rounded-xl border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Message content<span className="text-red-500"> *</span>
                    </Label>
                    <Textarea
                      placeholder="Write a clear, concise announcement..."
                      value={content}
                      onChange={(
                        e: React.ChangeEvent<HTMLTextAreaElement>
                      ) => setContent(e.target.value)}
                      required
                      rows={5}
                      className="min-h-[140px] rounded-xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary resize-y transition-all p-3"
                    />
                  </div>

                  {/* Audience Targeting – GA only */}
                  {isGA && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Filter className="size-4 text-primary" />
                          <p className="text-sm font-semibold text-slate-800">
                            Audience Targeting
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          Leave empty to send to everyone
                        </span>
                      </div>

                      <div className="space-y-5">
                        {/* Roles */}
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Target Roles
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {["ga", "jga", "animator", "volunteer"].map((r) => {
                              const active = targetRoles.includes(r);
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => toggleRole(r)}
                                  className={[
                                    "inline-flex items-center rounded-lg border px-3.5 py-1.5 text-sm font-medium capitalize transition-all duration-200",
                                    active
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300",
                                  ].join(" ")}
                                >
                                  {r}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Domains */}
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Target Domains
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "sports",
                              "literary",
                              "performing_creative_arts",
                              "club",
                              "miscellaneous",
                            ].map((d) => {
                              const active = targetDomains.includes(d);
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => toggleDomain(d)}
                                  className={[
                                    "inline-flex items-center rounded-lg border px-3.5 py-1.5 text-sm font-medium capitalize transition-all duration-200",
                                    active
                                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300",
                                  ].join(" ")}
                                >
                                  {d.replace(/_/g, " ")}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pin to top */}
                        <div className="mt-4 flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="pin"
                            checked={pinned}
                            onChange={(e) => setPinned(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary/50 transition-colors cursor-pointer"
                          />
                          <Label
                            htmlFor="pin"
                            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 select-none"
                          >
                            <Pin className="size-4 text-slate-400" />
                            Pin announcement to top
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* JGA info block */}
                  {!isGA && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Info className="mt-0.5 size-5 shrink-0 text-amber-500" />
                        <p className="leading-relaxed">
                          As a JGA, this announcement will automatically be
                          targeted to <strong className="font-semibold text-amber-900">Animators and Volunteers</strong>{" "}
                          within your <strong className="font-semibold text-amber-900">{user?.domain}</strong> domain.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsComposeOpen(false)}
                      className="h-11 rounded-xl border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Broadcasting...
                        </>
                      ) : (
                        <>
                          <Check className="size-4" />
                          Broadcast Announcement
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="glass-heavy border-dashed border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Megaphone className="size-16 mb-4 opacity-20" />
            <p className="text-xl font-display font-semibold mb-1 text-slate-800">
              No Announcements
            </p>
            <p className="text-sm text-center max-w-md">
              There are currently no announcements visible to you. Important
              updates from the secretariat will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card
              key={ann._id}
              onClick={() => handleMarkRead(ann._id, ann.isReadByMe)}
              className={`glass-heavy transition-all duration-300 border-l-4 overflow-hidden relative group cursor-pointer ${
                ann.pinned
                  ? "border-l-accent shadow-sm"
                  : !ann.isReadByMe
                  ? "border-l-primary shadow-sm"
                  : "border-l-transparent bg-white/40 shadow-none hover:bg-white/60"
              }`}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <div className="hidden sm:flex size-12 rounded-full bg-slate-100 items-center justify-center shrink-0 border shadow-sm overflow-hidden">
                    {ann.createdBy?.photoURL ? (
                      <img
                        src={ann.createdBy.photoURL}
                        alt={ann.createdBy.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <UserIcon className="size-6 text-slate-400" />
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2
                            className={`text-lg font-bold truncate ${
                              !ann.isReadByMe
                                ? "text-slate-900"
                                : "text-slate-700"
                            }`}
                          >
                            {ann.title}
                          </h2>
                          {ann.pinned && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-accent border-accent/30 bg-accent/5 gap-1 shrink-0"
                            >
                              <Pin className="size-3" /> Pinned
                            </Badge>
                          )}
                          {!ann.isReadByMe && (
                            <span className="flex h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-slate-600">
                            {ann.createdBy?.name || "Unknown Author"}
                          </span>
                          <span>•</span>
                          <span>{ann.createdBy?.role?.toUpperCase()}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDistanceToNow(new Date(ann.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons (Admin) */}
                      {isGA && (
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-accent hover:bg-accent/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePin(ann._id, ann.pinned);
                            }}
                            title={ann.pinned ? "Unpin" : "Pin to top"}
                          >
                            <Pin className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(ann._id);
                            }}
                            title="Delete announcement"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div
                      className={`text-sm leading-relaxed whitespace-pre-wrap mt-3 ${
                        !ann.isReadByMe ? "text-slate-700" : "text-slate-500"
                      }`}
                    >
                      {ann.content}
                    </div>

                    {/* Target Audience Tags (Visible to Author/Admin) */}
                    {isManager &&
                      (ann.targetRoles.length > 0 ||
                        ann.targetDomains.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/50">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1 flex items-center">
                            Target:
                          </span>
                          {ann.targetRoles.map((r) => (
                            <Badge
                              key={`r-${r}`}
                              variant="secondary"
                              className="text-[9px] bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                              Role: {r}
                            </Badge>
                          ))}
                          {ann.targetDomains.map((d) => (
                            <Badge
                              key={`d-${d}`}
                              variant="secondary"
                              className="text-[9px] bg-slate-100 text-slate-500 hover:bg-slate-200"
                            >
                              Domain: {d}
                            </Badge>
                          ))}
                        </div>
                      )}

                    {/* Read Status (Self and Global) */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {ann.isReadByMe ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <Check className="size-3.5" /> Read
                          </span>
                        ) : (
                          <span className="text-primary flex items-center gap-1 hover:underline cursor-pointer">
                            Mark as read
                          </span>
                        )}
                      </div>
                      {isManager && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Viewed by {ann.readBy.length}{" "}
                          {ann.readBy.length === 1 ? "person" : "people"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}