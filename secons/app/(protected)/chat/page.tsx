"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    MessageSquare, Users, Hash, Send, Search, Plus,
    ArrowLeft, MoreVertical, Paperclip, Smile, Reply,
    Check, CheckCheck, Edit3, Trash2, Pin, X,
    ChevronDown, RefreshCw, Shield, Star, Clock,
    Image as ImageIcon, FileText, AlertCircle, Lock,
    WifiOff, UserPlus, Ban, Phone, Video, Info
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger, DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

/* ============================
   TYPES
   ============================ */

interface ThreadData {
    _id: string;
    type: "workspace" | "domain" | "event" | "volunteer" | "custom";
    name: string;
    description?: string;
    avatar?: string;
    domain?: string;
    participants: string[];
    participantCount: number;
    createdBy: string;
    lastMessageAt?: string;
    lastMessage?: { content: string; senderId: string; sentAt: string } | null;
    unreadCount: number;
}

interface MessageData {
    _id: string;
    threadId: string;
    senderId: string;
    sender: { name: string; photoURL: string | null; role: string };
    content: string;
    attachments: { url: string; type: string; name: string; size: number }[];
    replyTo?: { _id: string; content: string; senderId: string; senderName: string } | null;
    readBy: string[];
    pinned: boolean;
    edited: boolean;
    isDeleted: boolean;
    reactions: { emoji: string; userIds: string[] }[];
    sentAt: string;
}

interface ParticipantInfo {
    uid: string;
    name: string;
    photoURL?: string;
    role: string;
    domain?: string;
}

interface UserContact {
    uid: string;
    name: string;
    email: string;
    photoURL?: string;
    role: string;
    domain: string;
    canContact: boolean;
    reason?: string;
}

/* ============================
   CONSTANTS & HELPERS
   ============================ */

const THREAD_TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
    workspace: { icon: "🏛️", color: "text-primary", label: "Workspace" },
    domain: { icon: "📋", color: "text-blue-500", label: "Domain" },
    event: { icon: "🎪", color: "text-purple-500", label: "Event" },
    volunteer: { icon: "🤝", color: "text-green-500", label: "Volunteer" },
    custom: { icon: "💬", color: "text-amber-500", label: "Custom" },
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Role-based contact permission matrix
function canContactUser(myRole: string, myDomain: string, targetRole: string, targetDomain: string): { allowed: boolean; reason?: string } {
    if (myRole === "ga") return { allowed: true };
    if (myRole === "jga") {
        if (targetRole === "ga" || targetRole === "jga") return { allowed: true };
        if (targetRole === "animator" && targetDomain === myDomain) return { allowed: true };
        return { allowed: false, reason: `JGAs can only contact Animators in their own domain` };
    }
    if (myRole === "animator") {
        if (targetRole === "jga" && targetDomain === myDomain) return { allowed: true };
        if (targetRole === "animator" && targetDomain === myDomain) return { allowed: true };
        if (targetRole === "volunteer") return { allowed: true };
        return { allowed: false, reason: `Animators can only contact their domain JGA` };
    }
    if (myRole === "volunteer") {
        if (targetRole === "animator") return { allowed: true };
        if (targetRole === "volunteer") return { allowed: true };
        return { allowed: false, reason: `Volunteers can only contact Animators` };
    }
    return { allowed: false, reason: "Contact not permitted" };
}

/* ============================
   MAIN CHAT PAGE
   ============================ */

export default function ChatPage() {
    const { user, getToken } = useAuth();
    const { isGA, isAdmin, isManager, role, domain } = useRole();

    const [threads, setThreads] = useState<ThreadData[]>([]);
    const [activeThread, setActiveThread] = useState<ThreadData | null>(null);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [replyTo, setReplyTo] = useState<MessageData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
    const [showInfo, setShowInfo] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [pendingMessages, setPendingMessages] = useState<{ content: string; threadId: string; replyTo?: string }[]>([]);
    const [activeTab, setActiveTab] = useState<"chats" | "contacts">("chats");
    const [allUsers, setAllUsers] = useState<UserContact[]>([]);
    const [contactSearch, setContactSearch] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageTimeRef = useRef<string | null>(null);

    // ── Online/Offline detection ──
    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        setIsOnline(navigator.onLine);
        return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
    }, []);

    // ── Send pending messages when back online ──
    useEffect(() => {
        if (isOnline && pendingMessages.length > 0) {
            pendingMessages.forEach(async (pm) => {
                try {
                    const token = await getToken();
                    await fetch(`/api/chat/threads/${pm.threadId}/messages`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ content: pm.content, replyTo: pm.replyTo }),
                    });
                } catch (e) { /* will retry next online cycle */ }
            });
            setPendingMessages([]);
            toast.success("Pending messages sent");
        }
    }, [isOnline, pendingMessages, getToken]);

    // ── Fetch threads ──
    const fetchThreads = useCallback(async () => {
        if (!navigator.onLine) { setLoading(false); return; }
        try {
            const token = await getToken();
            const res = await fetch("/api/chat/threads", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setThreads(data.data);
        } catch (e) {
            console.error("Failed to fetch threads:", e);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    // ── Fetch all users for contacts tab ──
    const fetchAllUsers = useCallback(async () => {
        if (!navigator.onLine) return;
        try {
            const token = await getToken();
            const res = await fetch("/api/users?limit=50", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                const contacts: UserContact[] = data.data.users
                    .filter((u: any) => u.uid !== user?.uid)
                    .map((u: any) => {
                        const perm = canContactUser(role || "student", domain || "general", u.role, u.domain);
                        return { uid: u.uid, name: u.name, email: u.email, photoURL: u.photoURL, role: u.role, domain: u.domain, canContact: perm.allowed, reason: perm.reason };
                    });
                setAllUsers(contacts);
            }
        } catch (e) { console.error("Failed to fetch users:", e); }
    }, [getToken, user, role, domain]);

    // ── Fetch messages ──
    const fetchMessages = useCallback(async (threadId: string, isPolling = false) => {
        if (!navigator.onLine) return;
        try {
            const token = await getToken();
            let url = `/api/chat/threads/${threadId}/messages`;
            if (isPolling && lastMessageTimeRef.current) {
                url += `?after=${encodeURIComponent(lastMessageTimeRef.current)}`;
            }
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                if (isPolling && data.data.messages.length > 0) {
                    setMessages((prev) => [...prev, ...data.data.messages]);
                    lastMessageTimeRef.current = data.data.messages[data.data.messages.length - 1].sentAt;
                    scrollToBottom();
                } else if (!isPolling) {
                    setMessages(data.data.messages);
                    if (data.data.messages.length > 0) {
                        lastMessageTimeRef.current = data.data.messages[data.data.messages.length - 1].sentAt;
                    }
                    setTimeout(scrollToBottom, 100);
                }
            }
        } catch (e) { console.error("Failed to fetch messages:", e); }
    }, [getToken]);

    // ── Fetch thread details ──
    const fetchThreadDetails = useCallback(async (threadId: string) => {
        if (!navigator.onLine) return;
        try {
            const token = await getToken();
            const res = await fetch(`/api/chat/threads/${threadId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setParticipants(data.data.participants);
        } catch (e) { console.error("Failed to fetch thread details:", e); }
    }, [getToken]);

    // ── Mark as read ──
    const markAsRead = useCallback(async (threadId: string) => {
        if (!navigator.onLine) return;
        try {
            const token = await getToken();
            await fetch(`/api/chat/threads/${threadId}/read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            setThreads((prev) => prev.map((t) => (t._id === threadId ? { ...t, unreadCount: 0 } : t)));
        } catch (e) { console.error("Failed to mark as read:", e); }
    }, [getToken]);

    // ── Send message ──
    const handleSend = async () => {
        if (!messageText.trim() || !activeThread || sendingMessage) return;

        // Queue if offline
        if (!isOnline) {
            setPendingMessages((prev) => [...prev, { content: messageText.trim(), threadId: activeThread._id, replyTo: replyTo?._id }]);
            const offlineMsg: MessageData = {
                _id: `pending-${Date.now()}`,
                threadId: activeThread._id,
                senderId: user?.uid || "",
                sender: { name: user?.name || "You", photoURL: user?.photoURL || null, role: role || "student" },
                content: messageText.trim(),
                attachments: [],
                replyTo: null,
                readBy: [],
                pinned: false,
                edited: false,
                isDeleted: false,
                reactions: [],
                sentAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, offlineMsg]);
            setMessageText("");
            setReplyTo(null);
            scrollToBottom();
            toast("Message queued — will send when online", { icon: "📤" });
            return;
        }

        setSendingMessage(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/chat/threads/${activeThread._id}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: messageText.trim(), replyTo: replyTo?._id || undefined }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages((prev) => [...prev, data.data]);
                setMessageText("");
                setReplyTo(null);
                lastMessageTimeRef.current = data.data.sentAt;
                scrollToBottom();
                setThreads((prev) =>
                    prev.map((t) => t._id === activeThread._id
                        ? { ...t, lastMessage: { content: data.data.content, senderId: data.data.senderId, sentAt: data.data.sentAt }, lastMessageAt: data.data.sentAt }
                        : t
                    ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
                );
                inputRef.current?.focus();
            } else {
                toast.error(data.error || "Send failed");
            }
        } catch (e) {
            toast.error("Failed to send message");
        } finally {
            setSendingMessage(false);
        }
    };

    // ── Start DM with contact ──
    const startDM = async (contact: UserContact) => {
        if (!contact.canContact) {
            toast.error(contact.reason || "Can't contact this user");
            return;
        }
        try {
            const token = await getToken();
            const res = await fetch("/api/chat/threads", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    type: "custom",
                    name: contact.name,
                    participantUids: [contact.uid],
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Chat with ${contact.name} started`);
                await fetchThreads();
                setActiveTab("chats");
                // Select the new thread
                const newThread: ThreadData = {
                    _id: data.data._id,
                    type: data.data.type,
                    name: data.data.name,
                    participants: data.data.participants,
                    participantCount: data.data.participants.length,
                    createdBy: user?.uid || "",
                    unreadCount: 0,
                    lastMessage: null,
                };
                selectThread(newThread);
            } else {
                toast.error(data.error || "Failed to start DM");
            }
        } catch (e) {
            toast.error("Failed to start conversation");
        }
    };

    // ── Select thread ──
    const selectThread = (thread: ThreadData) => {
        setActiveThread(thread);
        setMessages([]);
        setReplyTo(null);
        lastMessageTimeRef.current = null;
        setMobileView("chat");
        fetchMessages(thread._id);
        fetchThreadDetails(thread._id);
        markAsRead(thread._id);
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // ── Initial load ──
    useEffect(() => { fetchThreads(); fetchAllUsers(); }, [fetchThreads, fetchAllUsers]);

    // ── Polling — 1.5s for active chat, 8s for thread list ──
    useEffect(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (activeThread && isOnline) {
            pollingRef.current = setInterval(() => fetchMessages(activeThread._id, true), 1500);
            const threadPoll = setInterval(fetchThreads, 8000);
            return () => { if (pollingRef.current) clearInterval(pollingRef.current); clearInterval(threadPoll); };
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [activeThread, fetchMessages, fetchThreads, isOnline]);

    // ── Key handler ──
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Date helpers ──
    const formatMessageDate = (date: string) => {
        const d = new Date(date);
        if (isToday(d)) return "Today";
        if (isYesterday(d)) return "Yesterday";
        return format(d, "MMM d, yyyy");
    };

    const getDateSeparators = () => {
        const separators: Record<number, string> = {};
        let lastDate = "";
        messages.forEach((msg, idx) => {
            const msgDate = formatMessageDate(msg.sentAt);
            if (msgDate !== lastDate) { separators[idx] = msgDate; lastDate = msgDate; }
        });
        return separators;
    };

    // ── Filtered threads ──
    const filteredThreads = threads.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const groupedThreads = {
        pinned: filteredThreads.filter((t) => t.type === "workspace"),
        dms: filteredThreads.filter((t) => t.type === "volunteer" || t.type === "custom"),
        channels: filteredThreads.filter((t) => t.type === "domain" || t.type === "event"),
    };

    // ── Filtered contacts ──
    const filteredContacts = allUsers.filter((u) =>
        u.name.toLowerCase().includes(contactSearch.toLowerCase()) || u.email.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const dateSeparators = getDateSeparators();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-120px)]">
                <RefreshCw className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col rounded-3xl overflow-hidden border border-border/50 bg-white shadow-xl">

            {/* ═══ E2E Encryption Banner ═══ */}
            <div className="bg-gradient-to-r from-primary via-primary-600 to-primary-800 px-4 py-2 flex items-center justify-center gap-2 shrink-0">
                <Lock className="size-3 text-amber-300" />
                <span className="text-[10px] font-bold text-white/90 tracking-widest uppercase">
                    Secured End-to-End Encrypted Communication
                </span>
                <span className="text-[8px] text-white/50 ml-2">•</span>
                <Badge className="text-[7px] bg-amber-400/20 text-amber-200 border-amber-400/30 py-0 h-4 px-1.5 uppercase font-black tracking-wider">Beta</Badge>
            </div>

            {/* ═══ Offline Banner ═══ */}
            {!isOnline && (
                <div className="bg-red-500 px-4 py-1.5 flex items-center justify-center gap-2 shrink-0 animate-pulse">
                    <WifiOff className="size-3 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        You&apos;re Offline — Messages will be sent when connection is restored
                    </span>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* ═══════════════════════════════════════════
                    SIDEBAR — Discord-style channel list + Contacts
                   ═══════════════════════════════════════════ */}
                <div className={cn(
                    "w-full md:w-[340px] md:min-w-[340px] flex flex-col border-r border-border/30 bg-slate-50/80",
                    mobileView === "chat" && "hidden md:flex"
                )}>
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-border/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-display font-black text-slate-900 uppercase tracking-tight">Messages</h2>
                            <div className="flex items-center gap-1">
                                {isManager && <CreateThreadDialog onComplete={fetchThreads} />}
                            </div>
                        </div>

                        {/* Tabs: Chats / Contacts */}
                        <div className="flex bg-slate-200/60 rounded-xl p-0.5">
                            <button
                                onClick={() => setActiveTab("chats")}
                                className={cn("flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    activeTab === "chats" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <MessageSquare className="size-3.5 inline mr-1.5 -mt-0.5" />Chats
                            </button>
                            <button
                                onClick={() => { setActiveTab("contacts"); if (allUsers.length === 0) fetchAllUsers(); }}
                                className={cn("flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    activeTab === "contacts" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Users className="size-3.5 inline mr-1.5 -mt-0.5" />Contacts
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input
                                placeholder={activeTab === "chats" ? "Search chats..." : "Search contacts..."}
                                value={activeTab === "chats" ? searchQuery : contactSearch}
                                onChange={(e) => activeTab === "chats" ? setSearchQuery(e.target.value) : setContactSearch(e.target.value)}
                                className="pl-9 h-9 rounded-xl bg-white border-slate-200 text-sm"
                            />
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === "chats" ? (
                            <>
                                {groupedThreads.pinned.length > 0 && (
                                    <div className="px-3 pt-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-1">📌 Pinned</p>
                                        {groupedThreads.pinned.map((thread) => (
                                            <ThreadItem key={thread._id} thread={thread} isActive={activeThread?._id === thread._id} onClick={() => selectThread(thread)} currentUid={user?.uid || ""} />
                                        ))}
                                    </div>
                                )}
                                {groupedThreads.channels.length > 0 && (
                                    <div className="px-3 pt-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-1">📢 Channels</p>
                                        {groupedThreads.channels.map((thread) => (
                                            <ThreadItem key={thread._id} thread={thread} isActive={activeThread?._id === thread._id} onClick={() => selectThread(thread)} currentUid={user?.uid || ""} />
                                        ))}
                                    </div>
                                )}
                                {groupedThreads.dms.length > 0 && (
                                    <div className="px-3 pt-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-1">💬 Direct Messages</p>
                                        {groupedThreads.dms.map((thread) => (
                                            <ThreadItem key={thread._id} thread={thread} isActive={activeThread?._id === thread._id} onClick={() => selectThread(thread)} currentUid={user?.uid || ""} />
                                        ))}
                                    </div>
                                )}
                                {filteredThreads.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                        <MessageSquare className="size-10 mb-3 opacity-30" />
                                        <p className="text-sm font-semibold">No conversations yet</p>
                                        <p className="text-xs mt-1">Go to Contacts to start a chat</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* ═══ CONTACTS TAB ═══ */
                            <div className="px-3 pt-2 space-y-1">
                                {filteredContacts.map((contact) => (
                                    <button
                                        key={contact.uid}
                                        onClick={() => startDM(contact)}
                                        disabled={!contact.canContact}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                                            contact.canContact
                                                ? "hover:bg-white border border-transparent active:scale-[0.98]"
                                                : "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {contact.photoURL ? (
                                                <img src={contact.photoURL} alt={contact.name} className="size-10 rounded-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-primary">{contact.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-slate-800 truncate">{contact.name}</p>
                                                <Badge className={cn("text-[7px] font-mono uppercase py-0 h-3.5 px-1",
                                                    contact.role === "ga" ? "bg-amber-100 text-amber-700 border-amber-200"
                                                        : contact.role === "jga" ? "bg-blue-100 text-blue-700 border-blue-200"
                                                            : contact.role === "animator" ? "bg-green-100 text-green-700 border-green-200"
                                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                                )} variant="outline">
                                                    {contact.role}
                                                </Badge>
                                            </div>
                                            {contact.canContact ? (
                                                <p className="text-[10px] text-slate-400 truncate">{contact.domain.replace("_", " ")} • Tap to chat</p>
                                            ) : (
                                                <p className="text-[10px] text-red-400 flex items-center gap-1">
                                                    <Ban className="size-2.5" /> Can&apos;t be communicated
                                                </p>
                                            )}
                                        </div>
                                        {contact.canContact && <MessageSquare className="size-4 text-primary/40 shrink-0" />}
                                    </button>
                                ))}
                                {filteredContacts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                        <Users className="size-10 mb-3 opacity-30" />
                                        <p className="text-sm font-semibold">No contacts found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    CHAT AREA — WhatsApp-style messages
                   ═══════════════════════════════════════════ */}
                <div className={cn("flex-1 flex flex-col bg-white", mobileView === "sidebar" && "hidden md:flex")}>
                    {activeThread ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-4 flex items-center justify-between border-b border-border/30 bg-white/95 backdrop-blur-sm shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button onClick={() => setMobileView("sidebar")} className="md:hidden p-1 rounded-lg hover:bg-slate-100">
                                        <ArrowLeft className="size-5 text-slate-600" />
                                    </button>
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                                        {THREAD_TYPE_META[activeThread.type]?.icon || "💬"}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{activeThread.name}</h3>
                                        <p className="text-[10px] text-slate-400 truncate">
                                            {participants.length} members • {THREAD_TYPE_META[activeThread.type]?.label}
                                            {activeThread.type === "domain" && activeThread.domain && ` • ${activeThread.domain}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                        <Info className="size-5 text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area — WhatsApp wallpaper-like bg */}
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <div className="bg-primary/5 rounded-2xl p-6 text-center">
                                            <Lock className="size-8 mx-auto mb-3 text-primary/30" />
                                            <p className="text-sm font-semibold text-slate-500">Messages are end-to-end encrypted</p>
                                            <p className="text-xs mt-1 text-slate-400 max-w-xs">No one outside this chat can read or listen to them. Tap to learn more.</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={`msg-group-${msg._id}-${idx}`}>
                                            {dateSeparators[idx] && (
                                                <div className="flex items-center justify-center my-4">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-4 py-1 rounded-lg shadow-sm border border-slate-100">
                                                        {dateSeparators[idx]}
                                                    </span>
                                                </div>
                                            )}
                                            <MessageBubble
                                                message={msg}
                                                isOwn={msg.senderId === user?.uid}
                                                totalParticipants={participants.length}
                                                onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                onReact={async (emoji) => {
                                                    try {
                                                        const token = await getToken();
                                                        const res = await fetch(`/api/chat/threads/${activeThread._id}/messages/${msg._id}`, {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                            body: JSON.stringify({ reaction: emoji }),
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            setMessages((prev) => prev.map((m) => m._id === msg._id ? { ...m, reactions: data.data.reactions } : m));
                                                        }
                                                    } catch (e) { /* silent */ }
                                                }}
                                                currentUid={user?.uid || ""}
                                            />
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Preview */}
                            {replyTo && (
                                <div className="px-4 py-2 bg-primary/5 border-t border-primary/10 flex items-center gap-3">
                                    <div className="w-1 h-8 bg-primary rounded-full shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-primary">{replyTo.sender.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{replyTo.content}</p>
                                    </div>
                                    <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white rounded-lg">
                                        <X className="size-4 text-slate-400" />
                                    </button>
                                </div>
                            )}

                            {/* Compose Bar */}
                            <div className="px-4 py-3 border-t border-border/30 bg-white shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            ref={inputRef}
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={isOnline ? "Type a message..." : "You're offline..."}
                                            className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm pr-10"
                                            disabled={sendingMessage}
                                        />
                                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <Smile className="size-5" />
                                        </button>
                                    </div>
                                    <Button
                                        onClick={handleSend}
                                        disabled={!messageText.trim() || sendingMessage}
                                        size="icon"
                                        className="size-11 rounded-xl bg-primary shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        {sendingMessage ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-gradient-to-b from-slate-50/50 to-white">
                            <div className="size-24 rounded-3xl bg-primary/5 flex items-center justify-center mb-5">
                                <Lock className="size-12 text-primary/20" />
                            </div>
                            <h3 className="text-xl font-display font-black text-slate-600 mb-2 uppercase tracking-tight">SECONS Secure Chat</h3>
                            <p className="text-sm text-slate-400 max-w-sm text-center mb-4">End-to-end encrypted messaging for your team. Select a thread or start a new conversation.</p>
                            <Badge variant="outline" className="text-[8px] font-mono uppercase tracking-widest text-amber-500 border-amber-300">🔒 Under Development</Badge>
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════════════════════
                    INFO PANEL — Right drawer
                   ═══════════════════════════════════════════ */}
                {showInfo && activeThread && (
                    <div className="w-[300px] border-l border-border/30 bg-slate-50/80 flex-col hidden lg:flex overflow-y-auto">
                        <div className="p-4 border-b border-border/30 flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Thread Info</h4>
                            <button onClick={() => setShowInfo(false)} className="p-1 hover:bg-white rounded-lg">
                                <X className="size-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="text-center">
                                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-3">
                                    {THREAD_TYPE_META[activeThread.type]?.icon || "💬"}
                                </div>
                                <h4 className="font-black text-slate-900 uppercase">{activeThread.name}</h4>
                                {activeThread.description && <p className="text-xs text-slate-400 mt-1">{activeThread.description}</p>}
                                <Badge className="mt-2 text-[8px] font-mono uppercase">{activeThread.type}</Badge>
                            </div>

                            <div className="bg-primary/5 rounded-xl p-3 flex items-center gap-2">
                                <Lock className="size-4 text-primary" />
                                <p className="text-[10px] text-slate-600">Messages are end-to-end encrypted. Only participants can read them.</p>
                            </div>

                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Members ({participants.length})</p>
                                <div className="space-y-1.5">
                                    {participants.map((p) => (
                                        <div key={p.uid} className="flex items-center gap-2.5 p-2 rounded-xl bg-white">
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {p.photoURL ? (
                                                    <img src={p.photoURL} alt={p.name} className="size-8 rounded-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-primary">{p.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">
                                                    {p.name}
                                                    {p.uid === user?.uid && <span className="text-slate-400 font-normal"> (You)</span>}
                                                </p>
                                                <p className="text-[9px] text-slate-400 uppercase">{p.role}{p.domain ? ` • ${p.domain}` : ""}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================
   THREAD ITEM COMPONENT
   ============================ */

function ThreadItem({ thread, isActive, onClick, currentUid }: {
    thread: ThreadData;
    isActive: boolean;
    onClick: () => void;
    currentUid: string;
}) {
    const meta = THREAD_TYPE_META[thread.type];
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5 active:scale-[0.98]",
                isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-white border border-transparent"
            )}
        >
            <div className={cn("size-11 rounded-full flex items-center justify-center text-base shrink-0 overflow-hidden", isActive ? "bg-primary/20" : "bg-slate-100")}>
                {thread.avatar ? (
                    <img src={thread.avatar} alt={thread.name} className="size-full object-cover" />
                ) : (thread.type === "custom" && thread.participantCount === 2) ? (
                    <span className="text-[13px] font-bold text-primary">{thread.name.charAt(0).toUpperCase()}</span>
                ) : (
                    meta?.icon || "💬"
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-sm font-bold truncate", isActive ? "text-primary" : "text-slate-800")}>{thread.name}</p>
                    {thread.lastMessage && (
                        <span className="text-[9px] text-slate-400 shrink-0">{formatDistanceToNow(new Date(thread.lastMessage.sentAt), { addSuffix: false })}</span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-[11px] text-slate-400 truncate">
                        {thread.lastMessage
                            ? (thread.lastMessage.senderId === currentUid ? "You: " : "") + thread.lastMessage.content
                            : "No messages yet"
                        }
                    </p>
                    {thread.unreadCount > 0 && (
                        <Badge className="bg-green-500 text-white text-[8px] font-black px-1.5 py-0 h-4 rounded-full shrink-0 border-0">
                            {thread.unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </button>
    );
}

/* ============================
   MESSAGE BUBBLE COMPONENT
   ============================ */

function MessageBubble({ message, isOwn, totalParticipants, onReply, onReact, currentUid }: {
    message: MessageData;
    isOwn: boolean;
    totalParticipants: number;
    onReply: () => void;
    onReact: (emoji: string) => void;
    currentUid: string;
}) {
    const [showActions, setShowActions] = useState(false);
    const allRead = message.readBy.length >= totalParticipants;

    return (
        <div
            className={cn("flex gap-2 group", isOwn ? "justify-end" : "justify-start")}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar (others only) */}
            {!isOwn && (
                <div className="size-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-auto">
                    {message.sender.photoURL ? (
                        <img src={message.sender.photoURL} alt={message.sender.name} className="size-7 rounded-full object-cover" />
                    ) : (
                        <span className="text-[9px] font-bold text-slate-600">{message.sender.name.charAt(0)}</span>
                    )}
                </div>
            )}

            <div className={cn("max-w-[75%] md:max-w-[55%]", isOwn ? "order-first" : "")}>
                {/* Bubble */}
                <div className={cn(
                    "rounded-2xl px-3.5 py-2 relative shadow-sm",
                    isOwn
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white text-slate-900 rounded-bl-sm border border-slate-100",
                    message.isDeleted && "opacity-50 italic"
                )}>
                    {/* Sender name (not own, group chats) */}
                    {!isOwn && !message.isDeleted && (
                        <p className="text-[10px] font-bold text-primary mb-0.5">{message.sender.name}</p>
                    )}

                    {/* Reply preview */}
                    {message.replyTo && !message.isDeleted && (
                        <div className={cn(
                            "text-[10px] px-2.5 py-1.5 rounded-lg mb-2 border-l-3",
                            isOwn ? "bg-white/10 border-white/40 text-white/80" : "bg-slate-50 border-primary/40 text-slate-500"
                        )}>
                            <span className="font-bold block">{message.replyTo.senderName}</span>
                            <p className="truncate">{message.replyTo.content}</p>
                        </div>
                    )}

                    {/* Content */}
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

                    {/* Meta — time + read status */}
                    <div className={cn("flex items-center gap-1 mt-0.5 justify-end", isOwn ? "text-white/50" : "text-slate-400")}>
                        {message.edited && <span className="text-[8px] italic">edited</span>}
                        <span className="text-[9px]">{format(new Date(message.sentAt), "h:mm a")}</span>
                        {isOwn && !message._id.startsWith("pending-") && (
                            allRead ? (
                                <CheckCheck className="size-3.5 text-green-300" />
                            ) : message.readBy.length > 1 ? (
                                <CheckCheck className="size-3.5 text-white/50" />
                            ) : (
                                <Check className="size-3.5 text-white/40" />
                            )
                        )}
                        {message._id.startsWith("pending-") && (
                            <Clock className="size-3 text-white/40" />
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {message.reactions.length > 0 && (
                    <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
                        {message.reactions.map((r, i) => (
                            <button
                                key={i}
                                onClick={() => onReact(r.emoji)}
                                className={cn(
                                    "text-xs px-2 py-0.5 rounded-full border shadow-sm transition-all hover:scale-110",
                                    r.userIds.includes(currentUid) ? "bg-primary/10 border-primary/30" : "bg-white border-slate-200"
                                )}
                            >
                                {r.emoji} <span className="text-[9px] text-slate-500">{r.userIds.length}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick actions (hover) */}
            {showActions && !message.isDeleted && (
                <div className={cn("flex items-center gap-0.5 self-center", isOwn ? "order-first mr-1" : "ml-1")}>
                    <button onClick={onReply} className="p-1.5 rounded-lg hover:bg-slate-100 transition" title="Reply">
                        <Reply className="size-3.5 text-slate-400" />
                    </button>
                    {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
                        <button key={emoji} onClick={() => onReact(emoji)} className="text-sm hover:scale-125 transition-transform" title={emoji}>
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ============================
   CREATE THREAD DIALOG
   ============================ */

function CreateThreadDialog({ onComplete }: { onComplete: () => void }) {
    const { getToken } = useAuth();
    const { isGA, isAdmin } = useRole();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ type: "custom" as string, name: "", description: "", domain: "" });

    const handleCreate = async () => {
        if (!form.name.trim()) { toast.error("Thread name required"); return; }
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/chat/threads", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) { toast.success("Thread created"); setOpen(false); setForm({ type: "custom", name: "", description: "", domain: "" }); onComplete(); }
            else toast.error(data.error || "Failed to create thread");
        } catch (e) { toast.error("Failed to create thread"); }
        finally { setLoading(false); }
    };

    const threadTypes = isGA
        ? [{ value: "workspace", label: "🏛️ Workspace (GA + JGAs)" }, { value: "domain", label: "📋 Domain Channel" }, { value: "event", label: "🎪 Event Thread" }, { value: "volunteer", label: "🤝 Volunteer Briefing" }, { value: "custom", label: "💬 Custom Thread" }]
        : isAdmin
            ? [{ value: "domain", label: "📋 Domain Channel" }, { value: "volunteer", label: "🤝 Volunteer Briefing" }]
            : [{ value: "volunteer", label: "🤝 Volunteer Briefing" }];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="size-8 rounded-lg">
                    <Plus className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] bg-white border-slate-200 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-display font-black uppercase tracking-tight text-primary">New Thread</DialogTitle>
                    <DialogDescription>Create a new communication channel.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Thread Type</Label>
                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {threadTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Thread Name</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sports Planning" className="h-10" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Description (Optional)</Label>
                        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." className="h-10" />
                    </div>
                    {form.type === "domain" && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Domain</Label>
                            <Select value={form.domain} onValueChange={(v) => setForm({ ...form, domain: v })}>
                                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                                <SelectContent>
                                    {["sports", "cultural", "literary", "security", "stage_technical", "media", "hospitality", "finance"].map((d) => (
                                        <SelectItem key={d} value={d}>{d.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={loading} className="w-full h-11 rounded-xl bg-primary font-black uppercase tracking-widest text-xs">
                        {loading ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                        Create Thread
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
