"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AccessCodeGenerator } from "@/components/admin/AccessCodeGenerator";
import { RecentInvites } from "@/components/admin/RecentInvites";
import { MembersList } from "@/components/admin/MembersList";
import { Card, CardContent } from "@/components/ui/card";

export default function TeamPage() {
    const { user } = useAuth();
    const { isAdmin } = useRole();

    // Only GA and JGA can access Team Management
    if (!isAdmin) {
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-display font-bold text-foreground">Team Management</h1>
                </div>
                <Card className="glass-heavy border-primary/10">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <ShieldAlert className="size-12 mb-4 opacity-30" />
                        <p className="text-lg font-display font-semibold mb-1">Access Restricted</p>
                        <p className="text-sm text-center max-w-md">
                            Team management is only available to General Animators and Joint General Animators.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                    <MembersList />
                </TabsContent>

                <TabsContent value="invites" className="mt-6 space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <AccessCodeGenerator onSuccess={() => {
                                window.location.reload();
                            }} />
                        </div>
                        <div className="lg:col-span-2">
                            <RecentInvites />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
