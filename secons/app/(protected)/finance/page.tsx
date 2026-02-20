"use client";

import { Banknote, Receipt, PieChart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FinancePage() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Finance</h1>
                    <p className="text-muted-foreground">Budget management and expense tracking.</p>
                </div>
                <Badge variant="secondary" className="self-start text-xs px-3 py-1">
                    🚧 Coming Soon
                </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Banknote, label: "Budget", value: "—", desc: "Total allocated" },
                    { icon: Receipt, label: "Expenses", value: "—", desc: "Total spent" },
                    { icon: PieChart, label: "Breakdown", value: "—", desc: "By category" },
                    { icon: TrendingUp, label: "Balance", value: "—", desc: "Remaining" },
                ].map((item) => (
                    <Card key={item.label} className="glass-heavy border-primary/10 hover:shadow-glow transition-all">
                        <CardContent className="py-6">
                            <div className="flex items-center gap-3">
                                <item.icon className="size-8 text-accent opacity-60" />
                                <div>
                                    <p className="text-2xl font-display font-bold text-foreground">{item.value}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="glass-heavy border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Banknote className="size-12 mb-4 opacity-30" />
                    <p className="text-lg font-display font-semibold mb-1">Finance Module</p>
                    <p className="text-sm text-center max-w-md">
                        Track budgets, submit expenses, manage approvals, and view financial reports.
                        This module is currently under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
