"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/AppShell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace("/login");
            } else if (!user.onboardingComplete) {
                router.replace("/onboarding");
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--color-secons-bg, #F8F9FB)",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            border: "3px solid #E2E8F0",
                            borderTopColor: "#1A3C6E",
                            borderRadius: "50%",
                            margin: "0 auto 16px",
                            animation: "spin 0.8s linear infinite",
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || !user.onboardingComplete) {
        return null;
    }

    return <AppShell>{children}</AppShell>;
}
