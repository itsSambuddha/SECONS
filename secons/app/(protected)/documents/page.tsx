"use client";

import { FileText, Upload, FolderOpen, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DocumentsPage() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Documents</h1>
                    <p className="text-muted-foreground">Shared files and document management.</p>
                </div>
                <Badge variant="secondary" className="self-start text-xs px-3 py-1">
                    🚧 Coming Soon
                </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { icon: FolderOpen, label: "Event Plans", count: "—" },
                    { icon: FileText, label: "Itineraries", count: "—" },
                    { icon: Upload, label: "Uploads", count: "—" },
                ].map((item) => (
                    <Card key={item.label} className="glass-heavy border-primary/10 hover:shadow-glow transition-all">
                        <CardContent className="flex items-center gap-4 py-6">
                            <div className="size-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                                <item.icon className="size-6 text-accent opacity-60" />
                            </div>
                            <div>
                                <p className="font-display font-semibold text-foreground">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.count} files</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="glass-heavy border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FileText className="size-12 mb-4 opacity-30" />
                    <p className="text-lg font-display font-semibold mb-1">Documents Module</p>
                    <p className="text-sm text-center max-w-md">
                        Upload, organize, and share documents. Manage event plans, itineraries, and official files.
                        This module is currently under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
