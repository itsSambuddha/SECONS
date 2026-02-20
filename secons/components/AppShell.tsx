"use client";

import { useState } from "react";
import { Sidebar } from "./layout/Sidebar";
import { TopBar } from "./layout/TopBar";
import { MobileNav } from "./layout/MobileNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-background text-foreground font-body transition-colors duration-300">
            {/* Desktop Sidebar (Fixed) */}
            <Sidebar collapsed={sidebarCollapsed} className="hidden lg:flex fixed left-0 top-0 h-full z-50" />

            {/* Main Content Wrapper */}
            <div
                className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
            >
                {/* Top Bar (Sticky) */}
                <TopBar
                    onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    showMenuButton={true}
                    className="sticky top-0 z-40 w-full"
                />

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-8 overflow-y-auto w-full">
                    <div className="mx-auto max-w-7xl animate-fade-in-up w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Navigation (Bottom Fixed) */}
            <MobileNav />
        </div>
    );
}
