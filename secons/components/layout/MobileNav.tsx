"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { bottomNav, mainNav, secondaryNav } from "@/lib/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function MobileNav() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 glass-heavy border-t border-white/20 lg:hidden pb-safe">
            <div className="flex items-center justify-around h-16 px-2">
                {bottomNav.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(item.href + "/"));
                    const Icon = item.icon;

                    if (item.label === "More") {
                        return (
                            <Sheet key={item.label}>
                                <SheetTrigger asChild>
                                    <button className={cn(
                                        "flex flex-col items-center justify-center w-full h-full gap-1 p-1 transition-colors",
                                        "text-muted-foreground hover:text-foreground"
                                    )}>
                                        <Icon className="size-5" />
                                        <span className="text-[10px] font-medium">{item.label}</span>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0 border-r border-white/20 glass-heavy">
                                    <SheetHeader className="p-6 border-b border-white/10 text-left">
                                        <SheetTitle className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-display font-bold text-lg shadow-lg shadow-primary/25">S</div>
                                            <span className="font-display font-bold text-lg text-primary dark:text-white">SECONS</span>
                                        </SheetTitle>
                                    </SheetHeader>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                        {/* User Profile Card */}
                                        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                                                {user?.photoURL ? (
                                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                                ) : (
                                                    user?.name?.charAt(0) || "U"
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{user?.name || "Guest"}</p>
                                                <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "Visitor"}</p>
                                            </div>
                                        </div>

                                        {/* Main Navigation */}
                                        <div className="space-y-1">
                                            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
                                            {mainNav.map((navItem) => {
                                                const isNavItemActive = pathname === navItem.href;
                                                const NavIcon = navItem.icon;
                                                return (
                                                    <Link
                                                        key={navItem.href}
                                                        href={navItem.href}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                                                            isNavItemActive ? "bg-primary/10 text-primary dark:text-white font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        <NavIcon className="size-5" />
                                                        {navItem.label}
                                                    </Link>
                                                )
                                            })}
                                        </div>

                                        {/* Secondary Navigation */}
                                        <div className="space-y-1">
                                            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">System</p>
                                            {secondaryNav.map((navItem) => {
                                                const NavIcon = navItem.icon;
                                                return (
                                                    <Link
                                                        key={navItem.href}
                                                        href={navItem.href}
                                                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    >
                                                        <NavIcon className="size-5" />
                                                        {navItem.label}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer / Logout */}
                                    <div className="p-4 border-t border-border">
                                        <button
                                            onClick={() => signOut()}
                                            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm"
                                        >
                                            <LogOut className="size-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 p-1 transition-colors relative",
                                isActive ? "text-primary dark:text-white" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isActive && (
                                <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_0_8px_rgba(232,160,32,0.5)]" />
                            )}
                            <Icon className={cn("size-5 transition-transform", isActive && "scale-110")} />
                            <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
