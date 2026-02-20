"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Mail, MessageCircle, Copy, Check, Clock, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Invitation {
    _id: string;
    token: string;
    email?: string;
    name?: string;
    role: string;
    domain: string;
    used: boolean;
    lastEmailedAt?: string;
    createdAt: string;
    expiresAt: string;
}

export function RecentInvites() {
    const { getToken, user } = useAuth();
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filter/Sort
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    // Email Dialog
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
    const [emailInput, setEmailInput] = useState("");

    // WhatsApp Dialog
    const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
    const [whatsappInput, setWhatsappInput] = useState("");

    const fetchInvites = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch("/api/invitations?limit=20", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setInvites(data.data.invitations);
            }
        } catch (error) {
            console.error("Failed to fetch invites", error);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Code copied!");
    };

    // --- Email Logic ---
    const openEmailDialog = (invite: Invitation) => {
        setSelectedInvite(invite);
        setEmailInput(invite.email || "");
        setEmailDialogOpen(true);
    };

    const handleSendEmail = async () => {
        if (!selectedInvite || !emailInput) return;
        setActionLoading(selectedInvite._id);

        try {
            const token = await getToken();
            const res = await fetch("/api/invitations/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    token: selectedInvite.token,
                    email: emailInput,
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Email sent successfully!");
                setEmailDialogOpen(false);
                fetchInvites(); // Refresh to show "Sent" status if implemented
            } else {
                toast.error(data.error || "Failed to send email");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    // --- WhatsApp Logic ---
    const openWhatsappDialog = (invite: Invitation) => {
        setSelectedInvite(invite);
        setWhatsappInput("");
        setWhatsappDialogOpen(true);
    };

    const handleSendWhatsapp = () => {
        if (!selectedInvite || !whatsappInput) return;

        // Clean number
        const number = whatsappInput.replace(/[^\d]/g, "");
        if (number.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }

        const message = `Hello! You have been invited to join SECONS as a *${selectedInvite.role.toUpperCase()}* (${selectedInvite.domain}).\n\nYour Access Code: *${selectedInvite.token}*\n\nLogin here: ${window.location.origin}/login?code=${selectedInvite.token}`;

        const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");

        // Optimistically mark as sent locally or just close dialog
        setWhatsappDialogOpen(false);
        toast.success("WhatsApp chat opened!");
    };

    if (loading) return <div className="p-4 text-center">Loading invites...</div>;

    return (
        <>
            <Card className="glass border-white/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-display text-primary dark:text-white flex items-center gap-2">
                        <Clock className="size-5 text-accent" />
                        Recent Invites
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={fetchInvites} disabled={loading}>
                        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-primary/5">
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Role/Domain</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invites.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No recent invitations found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invites.map((invite) => (
                                        <TableRow key={invite._id} className="hover:bg-white/5">
                                            <TableCell className="font-mono font-bold text-primary">
                                                {invite.token}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium capitalize">{invite.role}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">{invite.domain}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(invite.createdAt), "MMM d, HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                {invite.used ? (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">Used</Badge>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <Badge variant="outline" className="border-accent text-accent">Active</Badge>
                                                        {invite.lastEmailedAt && <Badge variant="secondary" className="text-[10px]">Emailed</Badge>}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                                                        onClick={() => copyToClipboard(invite.token)}
                                                        title="Copy Code"
                                                    >
                                                        <Copy className="size-4" />
                                                    </Button>
                                                    {!invite.used && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={() => openEmailDialog(invite)}
                                                                disabled={!!actionLoading}
                                                                title="Send via Email"
                                                            >
                                                                {invite.lastEmailedAt ? <Check className="size-4" /> : <Mail className="size-4" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:text-green-600 hover:bg-green-50"
                                                                onClick={() => openWhatsappDialog(invite)}
                                                                title="Send via WhatsApp"
                                                            >
                                                                <MessageCircle className="size-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Email Dialog */}
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogContent className="glass-heavy border-white/20">
                    <DialogHeader>
                        <DialogTitle>Send Invite via Email</DialogTitle>
                        <DialogDescription>
                            Send the access code <strong>{selectedInvite?.token}</strong> to:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="recipient@example.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            type="email"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendEmail} disabled={!emailInput || !!actionLoading} className="text-white">
                            {actionLoading === selectedInvite?._id ? "Sending..." : "Send Email"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* WhatsApp Dialog */}
            <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
                <DialogContent className="glass-heavy border-white/20">
                    <DialogHeader>
                        <DialogTitle>Send via WhatsApp</DialogTitle>
                        <DialogDescription>
                            Enter the receiver's WhatsApp number (with country code):
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 relative">
                        <span className="absolute left-3 top-[26px] z-10 text-muted-foreground font-medium pointer-events-none text-sm">+91</span>
                        <Input
                            placeholder="9876543210"
                            value={whatsappInput.replace(/^\+91/, "")}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, "");
                                if (val.length <= 10) setWhatsappInput("+91" + val);
                            }}
                            type="tel"
                            className="pl-11 font-mono font-semibold tracking-wide"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            This will open WhatsApp Web or App with a pre-filled message.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWhatsappDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendWhatsapp} className="bg-green-600 hover:bg-green-700 text-white">
                            Open WhatsApp
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
