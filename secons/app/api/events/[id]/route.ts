import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import { deleteImage } from "@/lib/cloudinary";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/auth";

// ============================================================
// GET /api/events/[id] — Get single event
// Public for published/ongoing/completed events, all for admin
// ============================================================
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();

        const event = await Event.findById(id).lean();
        if (!event) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        // Check if public can view
        const publicStatuses = ["published", "ongoing", "completed"];
        if (!publicStatuses.includes(event.status)) {
            // Check if admin
            const authHeader = req.headers.get("authorization");
            if (!authHeader?.startsWith("Bearer ")) {
                return NextResponse.json<ApiResponse<null>>(
                    { success: false, error: "Event not found" },
                    { status: 404 }
                );
            }
            try {
                const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
                const role = decoded.role as UserRole;
                if (role !== "ga" && role !== "jga") {
                    return NextResponse.json<ApiResponse<null>>(
                        { success: false, error: "Event not found" },
                        { status: 404 }
                    );
                }
            } catch {
                return NextResponse.json<ApiResponse<null>>(
                    { success: false, error: "Event not found" },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json<ApiResponse<{ event: unknown }>>({
            success: true,
            data: { event },
        });
    } catch (error) {
        console.error("GET /api/events/[id] error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// PATCH /api/events/[id] — Update event (GA/JGA only)
// ============================================================
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        const role = decoded.role as UserRole;

        if (role !== "ga" && role !== "jga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only GA or JGA can update events" },
                { status: 403 }
            );
        }

        await connectDB();

        const existing = await Event.findById(id);
        if (!existing) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        const body = await req.json();
        const allowedFields = [
            "title", "category", "description", "rules", "eligibility",
            "venue", "startDateTime", "endDateTime", "jgaDomain",
            "registrationLink", "flierUrl", "status", "cancellationReason",
        ];

        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === "startDateTime" || field === "endDateTime") {
                    updates[field] = new Date(body[field] as string);
                } else {
                    updates[field] = body[field];
                }
            }
        }

        // If flyer URL is changing and old one was Cloudinary, cleanup old
        if (updates.flierUrl && existing.flierUrl && existing.flierUrl !== updates.flierUrl) {
            const oldUrl = existing.flierUrl as string;
            if (oldUrl.includes("cloudinary")) {
                try {
                    // Extract public_id from URL
                    const parts = oldUrl.split("/upload/");
                    if (parts[1]) {
                        const publicId = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
                        await deleteImage(publicId);
                    }
                } catch (e) {
                    console.warn("Failed to cleanup old flyer:", e);
                }
            }
        }

        const updated = await Event.findByIdAndUpdate(id, updates, { new: true }).lean();

        // If the status just changed to "published", notify users
        if (body.status === "published" && existing.status !== "published") {
            const allUsers = await User.find({ uid: { $ne: decoded.uid }, isActive: true }).select("uid").lean();
            if (allUsers.length > 0) {
                const notifications = allUsers.map(u => ({
                    userId: u.uid,
                    type: "system",
                    title: `Event Published: ${updated?.title || "New Event"}`,
                    body: `The ${updated?.category || ""} event is now open or live!`,
                    link: `/all-events`,
                }));
                await Notification.insertMany(notifications).catch(err => console.error("Failed to insert event notifications on patch", err));
            }
        }

        return NextResponse.json<ApiResponse<{ event: unknown }>>({
            success: true,
            data: { event: updated },
        });
    } catch (error) {
        console.error("PATCH /api/events/[id] error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// DELETE /api/events/[id] — Delete event + cleanup Cloudinary
// ============================================================
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const decoded = await verifyAndDecodeToken(authHeader.split("Bearer ")[1]);
        const role = decoded.role as UserRole;

        if (role !== "ga") {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Only GA can delete events" },
                { status: 403 }
            );
        }

        await connectDB();

        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Event not found" },
                { status: 404 }
            );
        }

        // Cleanup flyer from Cloudinary
        if (event.flierUrl && event.flierUrl.includes("cloudinary")) {
            try {
                const parts = event.flierUrl.split("/upload/");
                if (parts[1]) {
                    const publicId = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
                    await deleteImage(publicId);
                }
            } catch (e) {
                console.warn("Failed to cleanup flyer on delete:", e);
            }
        }

        await Event.findByIdAndDelete(id);

        return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
            success: true,
            data: { deleted: true },
        });
    } catch (error) {
        console.error("DELETE /api/events/[id] error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
