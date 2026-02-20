"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bell, Menu, X, ChevronRight, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
    className?: string;
    onMenuClick?: () => void;
    showMenuButton?: boolean;
}

export function TopBar({ className, onMenuClick, showMenuButton }: TopBarProps) {
    const pathname = usePathname();
    const { user } = useAuth();

    // Simple breadcrumb logic: /dashboard/events -> Dashboard > Events
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        return {
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            href,
            isLast
        };
    });

    return (
        <header
            className={cn(
                "sticky top-0 z-30 h-16 w-full px-6 flex items-center justify-between border-b border-white/20 glass-heavy transition-all duration-300",
                className
            )}
        >
            <div className="flex items-center gap-4">
                {showMenuButton && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <Menu className="size-5" />
                    </button>
                )}

                {/* Breadcrumbs (Desktop) */}
                <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">SECONS</Link>
                    {breadcrumbs.length > 0 && <ChevronRight className="size-4" />}
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.href} className="flex items-center gap-2">
                            {crumb.isLast ? (
                                <span className="font-medium text-foreground capitalize">{crumb.label}</span>
                            ) : (
                                <Link href={crumb.href} className="hover:text-foreground transition-colors capitalize">
                                    {crumb.label}
                                </Link>
                            )}
                            {!crumb.isLast && <ChevronRight className="size-4" />}
                        </div>
                    ))}
                </nav>

                {/* Mobile Title (if no breadcrumbs) */}
                <div className="md:hidden font-display font-bold text-lg text-foreground tracking-tight">
                    {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "SECONS"}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Notifications (Placeholder) */}
                <button className="relative p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group">
                    <Bell className="size-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 right-2 size-2 bg-accent rounded-full border-2 border-surface" />
                </button>

                {/* User Profile */}
                <Link href="/settings" className="flex items-center gap-3 pl-2 border-l border-border/50">
                    <div className="relative size-9 rounded-full overflow-hidden border border-border bg-muted group-hover:border-primary transition-colors">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-white">
                                <User className="size-5" />
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </header>
    );
}
