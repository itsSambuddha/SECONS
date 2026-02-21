"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, Trash2, MessageSquare, Info, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface NotificationData {
    _id: string;
    type: "chat" | "announcement" | "meeting" | "system";
    title: string;
    body: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

const TYPE_ICONS = {
    chat: <MessageSquare className="size-4 text-blue-500" />,
    announcement: <Info className="size-4 text-amber-500" />,
    meeting: <Calendar className="size-4 text-purple-500" />,
    system: <Bell className="size-4 text-slate-500" />
};

export function NotificationBell() {
    const { getToken, user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!user || !navigator.onLine) return;
        try {
            const token = await getToken();
            const res = await fetch("/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
            }
        } catch (error) {
            console.error(error);
        }
    }, [getToken, user]);

    // Initial fetch & set up polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // 15 sec polling
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Handle opening dropdown (and optionally auto-marking as read)
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            const token = await getToken();
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {
            toast.error("Failed to mark read");
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = await getToken();
            await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { }
    };

    const clearAll = async () => {
        if (notifications.length === 0) return;
        try {
            const token = await getToken();
            await fetch("/api/notifications", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications([]);
            setUnreadCount(0);
        } catch (e) {
            toast.error("Failed to clear notifications");
        }
    };

    const clearOne = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const token = await getToken();
            await fetch(`/api/notifications/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const notif = notifications.find(n => n._id === id);
            if (notif && !notif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            toast.error("Failed to delete notification");
        }
    };

    return (
        <div className="relative z-50" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={toggleDropdown}
                className="relative p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group"
            >
                <Bell className="size-5 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                    <span className="absolute top-[6px] right-[8px] flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-border/50 rounded-2xl shadow-2xl overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-slate-800 tracking-tight">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    title="Mark all as read"
                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Check className="size-4" />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    title="Clear all"
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                <Bell className="size-8 opacity-20 mb-2" />
                                <p className="text-sm font-medium">No new notifications</p>
                                <p className="text-xs opacity-75 mt-1">Check back later for updates</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notif) => {
                                    const Tag = notif.link ? Link : "div";
                                    return (
                                        <Tag
                                            key={notif._id}
                                            href={notif.link || "#"}
                                            onClick={() => {
                                                if (!notif.isRead) markAsRead(notif._id);
                                                if (notif.link) setIsOpen(false);
                                            }}
                                            className={cn(
                                                "block p-4 hover:bg-slate-50 transition-colors relative group",
                                                !notif.isRead ? "bg-primary/5" : "bg-white"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 shrink-0">
                                                    <div className={cn(
                                                        "size-8 rounded-full flex items-center justify-center bg-white border shadow-sm",
                                                        !notif.isRead ? "border-primary/20" : "border-slate-100"
                                                    )}>
                                                        {TYPE_ICONS[notif.type]}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <p className={cn(
                                                        "text-sm tracking-tight mb-0.5",
                                                        !notif.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"
                                                    )}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                        {notif.body}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Clear Single Button - Visible on hover */}
                                            <button
                                                onClick={(e) => clearOne(notif._id, e)}
                                                className="absolute top-4 right-4 p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-slate-100 rounded-md transition-all"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>

                                            {/* Unread dot */}
                                            {!notif.isRead && (
                                                <div className="absolute top-1/2 -translate-y-1/2 right-4 size-2 rounded-full bg-primary group-hover:opacity-0 transition-opacity" />
                                            )}
                                        </Tag>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-border/50 bg-slate-50 text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                            Auto-deleted after 24 hours
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
