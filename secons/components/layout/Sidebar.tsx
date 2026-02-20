"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNav, secondaryNav } from "@/lib/navigation";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
    className?: string;
    collapsed?: boolean;
}

export function Sidebar({ className, collapsed }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-white/20 glass-heavy transition-all duration-300",
                collapsed ? "w-20" : "w-64",
                className
            )}
        >
            {/* Logo Area */}
            <div className={cn("h-16 flex items-center px-6 border-b border-border", collapsed ? "justify-center px-2" : "justify-start")}>
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <span className="text-white font-display font-bold text-lg">S</span>
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col animate-fade-in-up">
                            <span className="font-display font-bold text-lg tracking-tight text-primary dark:text-white leading-none">SECONS</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">EdBlazon Platform</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 no-scrollbar">
                {mainNav.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary dark:text-white dark:bg-primary/20 font-semibold shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <Icon className={cn("size-5 shrink-0 transition-colors", isActive ? "text-primary dark:text-white" : "text-muted-foreground group-hover:text-foreground")} />

                            {!collapsed && (
                                <span className="truncate">{item.label}</span>
                            )}

                            {/* Active Indicator Line */}
                            {isActive && !collapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                            )}

                            {/* Tooltip for collapsed state would go here */}
                        </Link>
                    );
                })}

                <div className="my-4 border-t border-border/50 mx-2" />

                {secondaryNav.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-muted text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <Icon className="size-5 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-white/10">
                <div className={cn("flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors", collapsed && "justify-center p-0")}>
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className={cn("rounded-full overflow-hidden border border-border bg-muted", collapsed ? "size-8" : "size-9")}>
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xs font-bold">
                                    {user?.name?.charAt(0) || "U"}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-surface rounded-full"></div>
                    </div>

                    {!collapsed && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-semibold truncate text-foreground">{user?.name || "User"}</p>
                            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "Guest"}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
