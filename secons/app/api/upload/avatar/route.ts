import { NextRequest, NextResponse } from "next/server";
import { verifyAndDecodeToken } from "@/lib/firebase-admin";
import { uploadImage } from "@/lib/cloudinary";

// Max file size: 2MB
const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        const decoded = await verifyAndDecodeToken(authHeader.split(" ")[1]);
        if (!decoded.uid) {
            return NextResponse.json(
                { success: false, error: "Invalid token" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("avatar") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Only JPEG, PNG, and WebP images are allowed" },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { success: false, error: "File size must be under 2MB" },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to Cloudinary
        // Use uid as public_id to overwrite previous avatars automatically
        const result = await uploadImage(buffer, "avatars", decoded.uid);

        return NextResponse.json({
            success: true,
            data: { url: result.url }
        });

    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json(
            { success: false, error: "Upload failed" },
            { status: 500 }
        );
    }
}
