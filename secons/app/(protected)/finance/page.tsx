"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Banknote,
    Plus,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    ArrowDownLeft,
    Filter,
    Search,
    Receipt,
    Loader2,
    Check,
    X,
    MoreVertical,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ============================================================
// Finance Module — Budgets & Expenses
// ============================================================

const DOMAINS = ["sports", "cultural", "literary", "security", "stage_technical", "media", "hospitality", "finance", "general"];
const CATEGORIES = ["venue", "equipment", "printing", "food_beverages", "decorations", "transport", "prizes", "miscellaneous"];

export default function FinancePage() {
    const { user, getToken } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ totalBudget: 0, totalSpent: 0, remaining: 0 });
    const [loading, setLoading] = useState(true);
    const [filterDomain, setFilterDomain] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const domainParam = filterDomain !== "all" ? `&domain=${filterDomain}` : "";

            // Fetch Transactions
            const txRes = await fetch(`/api/finance?${domainParam}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const txData = await txRes.json();
            if (txData.success) setTransactions(txData.data);

            // Fetch Stats
            const statsRes = await fetch(`/api/finance/stats?${domainParam}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const statsData = await statsRes.json();
            if (statsData.success) setStats(statsData.data);

        } catch (error) {
            toast.error("Failed to load financial telemetry");
        } finally {
            setLoading(false);
        }
    }, [getToken, filterDomain]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (id: string, status: "approved" | "rejected") => {
        try {
            const token = await getToken();
            const res = await fetch(`/api/finance/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Transaction ${status}`);
                fetchData();
            }
        } catch (error) {
            toast.error("Process failed");
        }
    };

    const isGA = user?.role === "ga";

    return (
        <div className="p-8 space-y-12 max-w-7xl mx-auto">
            {/* Header / Dynamic Stats Island */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-display font-black tracking-tight text-slate-900 uppercase">
                        Circuit <span className="text-primary italic">Finance</span>
                    </h1>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                        <Banknote className="size-3 text-primary" /> Financial Registry & Protocol Oversight
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <FinanceDialog mode="expense" onComplete={fetchData} />
                    {isGA && <FinanceDialog mode="allocation" onComplete={fetchData} />}
                </div>
            </div>

            {/* Stats Overview — High Precision Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Allocation"
                    value={stats.totalBudget}
                    icon={TrendingUp}
                    sub="Reserved for festival operations"
                    className="bg-primary/5 border-primary/20"
                />
                <StatCard
                    label="Actual Expenditure"
                    value={stats.totalSpent}
                    icon={TrendingDown}
                    sub="Approved and processed funds"
                    color="text-red-500"
                />
                <StatCard
                    label="Remaining Fluidity"
                    value={stats.remaining}
                    icon={Clock}
                    sub="Balance available across nodes"
                    color="text-amber-500"
                />
            </div>

            {/* Utility Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/40 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input
                            placeholder="Search description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 rounded-2xl bg-white/60 border-0 shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    {isGA && (
                        <Select value={filterDomain} onValueChange={setFilterDomain}>
                            <SelectTrigger className="w-[160px] h-10 rounded-2xl bg-white/60 border-0 shadow-sm">
                                <Filter className="size-3 mr-2 text-slate-400" />
                                <SelectValue placeholder="All Domains" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl glass-heavy">
                                <SelectItem value="all">All Domains</SelectItem>
                                {DOMAINS.map(d => (
                                    <SelectItem key={d} value={d} className="uppercase text-[10px] font-bold">{d.replace('_', ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden md:block">
                    {transactions.length} Transactions Logged
                </div>
            </div>

            {/* Transaction Grid */}
            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="p-6 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Transaction / Domain</th>
                                <th className="p-6 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                <th className="p-6 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Scale</th>
                                <th className="p-6 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">Verification</th>
                                <th className="p-6 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <Loader2 className="size-10 animate-spin text-primary mx-auto mb-4" />
                                        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Hydrating Financial Data...</p>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                            <Banknote className="size-10" />
                                        </div>
                                        <p className="text-slate-500 font-display font-black text-xl mb-2 italic">Zero Financial Activity</p>
                                        <p className="text-slate-400 text-sm">No expenses or allocations found for this circuit.</p>
                                    </td>
                                </tr>
                            ) : transactions
                                .filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((tx) => (
                                    <tr key={tx._id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "size-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                                    tx.type === "budget_allocation" ? "bg-primary text-white" : "bg-white text-slate-400 border border-slate-100"
                                                )}>
                                                    {tx.type === "budget_allocation" ? <ArrowUpRight className="size-5" /> : <ArrowDownLeft className="size-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{tx.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-mono font-black uppercase text-slate-400 tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">
                                                            {tx.domain}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-medium">via {tx.submittedBy?.name} • {format(new Date(tx.createdAt), 'MMM dd, HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <Badge variant="outline" className="rounded-full bg-white text-[9px] uppercase font-mono py-0.5 border-slate-200">
                                                {tx.category.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="p-6">
                                            <p className={cn("text-lg font-black font-display tracking-tight", tx.type === "budget_allocation" ? "text-primary" : "text-slate-900")}>
                                                ₹{tx.amount.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <StatusBadge status={tx.status} />
                                                {tx.receiptUrl && (
                                                    <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm">
                                                        <Receipt className="size-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            {isGA && tx.status === "pending" ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        className="size-8 rounded-xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200"
                                                        onClick={() => handleAction(tx._id, "approved")}
                                                    >
                                                        <Check className="size-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className="size-8 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 border-0"
                                                        onClick={() => handleAction(tx._id, "rejected")}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="size-4 text-slate-300" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, sub, color = "text-primary", className }: any) {
    return (
        <Card className={cn("relative overflow-hidden p-8 rounded-[2.5rem] border border-white/40 glass-heavy shadow-2xl transition-all hover:-translate-y-1 hover:shadow-primary/5", className)}>
            <div className="absolute top-0 right-0 p-8 text-primary/5 -mr-4 -mt-4">
                <Icon className="size-24" />
            </div>
            <div className="space-y-4 relative z-10">
                <div className="size-10 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-50">
                    <Icon className={cn("size-5", color)} />
                </div>
                <div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black">{label}</p>
                    <h3 className={cn("text-4xl font-display font-black tracking-tight", color)}>
                        ₹{value.toLocaleString()}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">{sub}</p>
                </div>
            </div>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: any = {
        approved: { label: "Approved", icon: CheckCircle2, class: "bg-green-50 text-green-600 border-green-200" },
        pending: { label: "Pending", icon: Clock, class: "bg-amber-50 text-amber-600 border-amber-200" },
        rejected: { label: "Rejected", icon: XCircle, class: "bg-red-50 text-red-600 border-red-200" }
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
        <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border", config.class)}>
            <Icon className="size-3" />
            {config.label}
        </span>
    );
}

function FinanceDialog({ mode, onComplete }: { mode: "allocation" | "expense", onComplete: () => void }) {
    const { user, getToken } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        amount: "",
        description: "",
        domain: user?.role === "jga" ? user?.domain : "sports",
        category: "miscellaneous",
        receiptUrl: ""
    });

    const isAllocation = mode === "allocation";

    const handleSubmit = async () => {
        if (!form.amount || !form.description || !form.domain) {
            toast.error("Telemetry incomplete");
            return;
        }

        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/finance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: isAllocation ? "budget_allocation" : "expense",
                    amount: parseFloat(form.amount || "0"),
                    description: form.description,
                    domain: form.domain,
                    category: form.category,
                    receiptUrl: form.receiptUrl
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(isAllocation ? "Budget linked" : "Expense transmitted");
                setOpen(false);
                setForm({ amount: "", description: "", domain: user?.role === "jga" ? user?.domain : "sports", category: "miscellaneous", receiptUrl: "" });
                onComplete();
            }
        } catch (error) {
            toast.error("Transmission failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className={cn(
                    "rounded-2xl h-11 px-6 font-display font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95",
                    isAllocation ? "bg-primary hover:bg-primary/90" : "bg-white text-slate-900 border border-slate-100 hover:bg-slate-50"
                )}>
                    <Plus className="size-3 mr-2" />
                    {isAllocation ? "Link Allocation" : "Submit Expense"}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] glass-heavy border-white/20 p-8 space-y-8 min-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-display font-black tracking-tighter uppercase text-slate-900">
                        {isAllocation ? "Balance Allocation" : "Expense Submission"}
                    </DialogTitle>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Node Finance Protocol V1.0</p>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 ml-1">Quantum scale (Amount)</Label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-display font-black text-slate-300 text-2xl">₹</span>
                            <Input
                                type="number"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                className="h-16 pl-12 text-3xl font-display font-black rounded-3xl bg-white/60 border-0 shadow-inner"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 ml-1">Circuit Domain</Label>
                            <Select
                                value={form.domain}
                                onValueChange={(v) => setForm({ ...form, domain: v })}
                                disabled={user?.role === "jga"}
                            >
                                <SelectTrigger className="h-12 rounded-2xl bg-white/60 border-0 shadow-sm uppercase font-bold text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-heavy rounded-2xl border-white/20">
                                    {DOMAINS.map(d => <SelectItem key={d} value={d} className="uppercase font-bold text-[10px]">{d.replace('_', ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 ml-1">Category Code</Label>
                            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                <SelectTrigger className="h-12 rounded-2xl bg-white/60 border-0 shadow-sm uppercase font-bold text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-heavy rounded-2xl border-white/20">
                                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="uppercase font-bold text-[10px]">{c.replace('_', ' ')}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 ml-1">Engagement Detail (Description)</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="h-12 rounded-2xl bg-white/60 border-0 shadow-sm font-medium"
                            placeholder="Brief protocol description..."
                        />
                    </div>

                    {!isAllocation && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 ml-1">Receipt URL (Optional)</Label>
                            <Input
                                value={form.receiptUrl}
                                onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
                                className="h-12 rounded-2xl bg-white/60 border-0 shadow-sm font-medium"
                                placeholder="https://cloudinary.com/..."
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-14 rounded-3xl bg-slate-900 text-white font-display font-black uppercase tracking-[0.3em] text-[11px] hover:bg-primary hover:tracking-[0.4em] transition-all shadow-2xl"
                    >
                        {loading ? <Loader2 className="size-5 animate-spin" /> : (isAllocation ? "Execute Allocation" : "Transmit Submission")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
