"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ============================================================
// Context
// ============================================================
interface AppShellContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const AppShellContext = createContext<AppShellContextType>({
    sidebarOpen: false,
    setSidebarOpen: () => { },
});

export function useAppShell() {
    return useContext(AppShellContext);
}

// ============================================================
// Navigation Items
// ============================================================
interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
}

const mainNav: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        label: "Events",
        href: "/events",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
    },
    {
        label: "Sports",
        href: "/sports",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
        ),
    },
    {
        label: "Leaderboard",
        href: "/leaderboard",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <line x1="12" x2="12" y1="20" y2="10" />
                <line x1="18" x2="18" y1="20" y2="4" />
                <line x1="6" x2="6" y1="20" y2="16" />
            </svg>
        ),
    },
    {
        label: "Finance",
        href: "/finance",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    {
        label: "Chat",
        href: "/chat",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
        ),
    },
    {
        label: "Announcements",
        href: "/announcements",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="m3 11 18-5v12L3 13v-2z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
        ),
    },
    {
        label: "Calendar",
        href: "/calendar",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
];

const bottomNav: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: mainNav[0].icon,
    },
    {
        label: "Events",
        href: "/events",
        icon: mainNav[1].icon,
    },
    {
        label: "Sports",
        href: "/sports",
        icon: mainNav[2].icon,
    },
    {
        label: "Chat",
        href: "/chat",
        icon: mainNav[5].icon,
    },
    {
        label: "More",
        href: "#",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
            </svg>
        ),
    },
];

// ============================================================
// AppShell Component
// ============================================================
export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [pathname, isMobile]);

    return (
        <AppShellContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
            <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-secons-bg)" }}>
                {/* Sidebar Overlay (mobile) */}
                {isMobile && sidebarOpen && (
                    <div
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 40,
                            background: "rgba(0, 0, 0, 0.4)",
                            backdropFilter: "blur(4px)",
                        }}
                    />
                )}

                {/* Sidebar */}
                <aside
                    style={{
                        position: isMobile ? "fixed" : "sticky",
                        top: 0,
                        left: 0,
                        zIndex: 50,
                        width: "260px",
                        height: "100vh",
                        background: "var(--color-surface)",
                        borderRight: "1px solid var(--color-secons-border)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
                        overflowY: "auto",
                        boxShadow: isMobile && sidebarOpen ? "var(--shadow-xl)" : "none",
                    }}
                >
                    {/* Logo */}
                    <div
                        style={{
                            padding: "20px 20px 16px",
                            borderBottom: "1px solid var(--color-secons-border)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "var(--radius-md)",
                                background: "linear-gradient(135deg, #1A3C6E 0%, #2A5494 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <span style={{ color: "white", fontWeight: 800, fontSize: "16px", fontFamily: "var(--font-display)" }}>
                                S
                            </span>
                        </div>
                        <div>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "16px", color: "var(--color-text-primary)" }}>
                                SECONS
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.03em" }}>
                                EdBlazon Platform
                            </div>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                        {mainNav.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "10px 12px",
                                        borderRadius: "var(--radius-md)",
                                        fontSize: "14px",
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? "#1A3C6E" : "var(--color-text-secondary)",
                                        background: isActive ? "#EBF0F7" : "transparent",
                                        transition: "all 0.15s ease",
                                        textDecoration: "none",
                                    }}
                                >
                                    <span style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
                                    {item.label}
                                    {item.badge && (
                                        <span
                                            style={{
                                                marginLeft: "auto",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: "white",
                                                background: "#E8A020",
                                                padding: "2px 8px",
                                                borderRadius: "var(--radius-full)",
                                                lineHeight: "16px",
                                            }}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div
                        style={{
                            padding: "16px",
                            borderTop: "1px solid var(--color-secons-border)",
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                            textAlign: "center",
                        }}
                    >
                        SECONS v1.0
                    </div>
                </aside>

                {/* Main Area */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                    {/* Top Bar */}
                    <header
                        style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 30,
                            height: "64px",
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(12px)",
                            borderBottom: "1px solid var(--color-secons-border)",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 24px",
                            gap: "16px",
                        }}
                    >
                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "8px",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--color-text-primary)",
                                display: isMobile ? "flex" : "none",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                                <line x1="4" x2="20" y1="12" y2="12" />
                                <line x1="4" x2="20" y1="6" y2="6" />
                                <line x1="4" x2="20" y1="18" y2="18" />
                            </svg>
                        </button>

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Placeholder user avatar */}
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #1A3C6E, #2A5494)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>U</span>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main style={{ flex: 1, padding: "24px", maxWidth: "100%", overflow: "auto" }}>
                        {children}
                    </main>
                </div>

                {/* Bottom Navigation (mobile only) */}
                {isMobile && (
                    <nav
                        style={{
                            position: "fixed",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 40,
                            height: "64px",
                            background: "var(--color-surface)",
                            borderTop: "1px solid var(--color-secons-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-around",
                            paddingBottom: "env(safe-area-inset-bottom, 0px)",
                        }}
                    >
                        {bottomNav.map((item) => {
                            const isActive = item.href !== "#" && (pathname === item.href || pathname.startsWith(item.href + "/"));
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={
                                        item.label === "More"
                                            ? (e) => {
                                                e.preventDefault();
                                                setSidebarOpen(true);
                                            }
                                            : undefined
                                    }
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "2px",
                                        padding: "6px 12px",
                                        fontSize: "11px",
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? "#1A3C6E" : "var(--color-text-muted)",
                                        textDecoration: "none",
                                        transition: "color 0.15s",
                                    }}
                                >
                                    <span style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>
        </AppShellContext.Provider>
    );
}
