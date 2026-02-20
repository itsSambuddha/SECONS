import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EventCategory from "@/models/EventCategory";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/auth";

// Default categories — seeded on first GET if none exist
const DEFAULT_CATEGORIES = [
    { name: "Sports", slug: "sports", isDefault: true },
    { name: "Literary", slug: "literary", isDefault: true },
    { name: "Performing & Creative Arts", slug: "performing_creative_arts", isDefault: true },
];

// ============================================================
// GET /api/events/categories — List all categories (public)
// ============================================================
export async function GET() {
    try {
        await connectDB();

        // Seed defaults if empty
        const count = await EventCategory.countDocuments();
        if (count === 0) {
            await EventCategory.insertMany(DEFAULT_CATEGORIES);
        }

        const categories = await EventCategory.find()
            .sort({ isDefault: -1, name: 1 })
            .lean();

        return NextResponse.json<ApiResponse<{ categories: unknown[] }>>({
            success: true,
            data: { categories },
        });
    } catch (error) {
        console.error("GET /api/events/categories error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// POST /api/events/categories — Create a new category (GA/JGA)
// ============================================================
export async function POST(req: NextRequest) {
    try {
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
                { success: false, error: "Only GA/JGA can manage categories" },
                { status: 403 }
            );
        }

        const { name } = await req.json();
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Category name is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

        // Check duplicate
        const existing = await EventCategory.findOne({ slug });
        if (existing) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Category already exists" },
                { status: 409 }
            );
        }

        // Get creator's user ID
        const User = (await import("@/models/User")).default;
        const creator = await User.findOne({ uid: decoded.uid }).lean();

        const category = await EventCategory.create({
            name: name.trim(),
            slug,
            isDefault: false,
            createdBy: creator?._id,
        });

        return NextResponse.json<ApiResponse<{ category: unknown }>>({
            success: true,
            data: { category },
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/events/categories error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================================
// DELETE /api/events/categories — Delete a category (GA only)
// Body: { slug: string }
// ============================================================
export async function DELETE(req: NextRequest) {
    try {
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
                { success: false, error: "Only GA can delete categories" },
                { status: 403 }
            );
        }

        const { slug } = await req.json();
        if (!slug) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Category slug is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const category = await EventCategory.findOne({ slug });
        if (!category) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Category not found" },
                { status: 404 }
            );
        }

        if (category.isDefault) {
            return NextResponse.json<ApiResponse<null>>(
                { success: false, error: "Cannot delete default categories" },
                { status: 400 }
            );
        }

        await EventCategory.findByIdAndDelete(category._id);

        return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
            success: true,
            data: { deleted: true },
        });
    } catch (error) {
        console.error("DELETE /api/events/categories error:", error);
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
