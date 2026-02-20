"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AccessCodeGenerator } from "@/components/admin/AccessCodeGenerator";
import { RecentInvites } from "@/components/admin/RecentInvites";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TeamPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-display font-bold text-foreground">Team Management</h1>
                <p className="text-muted-foreground">Manage your team members and invitations.</p>
            </div>

            <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="members" className="gap-2">
                        <Users className="size-4" /> Members
                    </TabsTrigger>
                    <TabsTrigger value="invites" className="gap-2">
                        <UserPlus className="size-4" /> Invitations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6">
                    <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/30 text-muted-foreground">
                        User Directory coming soon...
                    </div>
                </TabsContent>

                <TabsContent value="invites" className="mt-6 space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Generator Section */}
                        <div className="lg:col-span-1 space-y-6">
                            <AccessCodeGenerator onSuccess={() => {
                                // Trigger refresh of RecentInvites via window reload for simplicity
                                window.location.reload();
                            }} />
                        </div>

                        {/* Active Invites List */}
                        <div className="lg:col-span-2">
                            <RecentInvites />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
