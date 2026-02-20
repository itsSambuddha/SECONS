import { NextRequest, NextResponse } from "next/server";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import { uploadImage } from "@/lib/cloudinary";
import type { UserRole } from "@/types/auth";

// Max file size: 5MB for flyers
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const decoded = await verifyAndDecodeToken(authHeader.split(" ")[1]);
        const role = decoded.role as UserRole;

        if (role !== "ga" && role !== "jga") {
            return NextResponse.json(
                { success: false, error: "Only GA/JGA can upload flyers" },
                { status: 403 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("flyer") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, error: "File size must be under 5MB" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to Cloudinary in secons/flyers folder
        // Use timestamp to create unique filenames
        const filename = `flyer_${Date.now()}`;
        const result = await uploadImage(buffer, "flyers", filename);

        return NextResponse.json({
            success: true,
            data: { url: result.url, public_id: result.public_id },
        });
    } catch (error) {
        console.error("Flyer upload error:", error);
        return NextResponse.json(
            { success: false, error: "Upload failed" },
            { status: 500 }
        );
    }
}
