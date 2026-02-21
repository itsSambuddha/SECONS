import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Finance from "@/models/Finance";
import User from "@/models/User";
import { withAuth } from "@/lib/withAuth";

// ============================================================
// GET /api/finance — List transactions
// ============================================================
export const GET = withAuth(async (req, { user }) => {
    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get("type");
        const status = searchParams.get("status");
        const domain = searchParams.get("domain");

        let query: any = {};
        if (type) query.type = type;
        if (status) query.status = status;

        // Role-based filtering
        if (user.role === "ga") {
            if (domain) query.domain = domain;
        } else if (user.role === "jga") {
            // JGAs only see their own domain's finance
            query.domain = user.domain;
        } else {
            // Students/Animators only see their own submissions
            query.submittedBy = user.uid; // Note: submittedBy is ref "User" but we store uid in session. Need to resolve mongo ID.
        }

        const dbUser = await User.findOne({ uid: user.uid }).select("_id").lean();
        if (user.role !== "ga" && user.role !== "jga") {
            query.submittedBy = dbUser?._id;
        }

        const transactions = await Finance.find(query)
            .populate("submittedBy", "name role")
            .populate("approvedBy", "name role")
            .populate("eventId", "title")
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: transactions });
    } catch (error) {
        console.error("GET /api/finance error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}, ["ga", "jga", "animator", "volunteer", "student"]);

// ============================================================
// POST /api/finance — Submit allocation/expense
// ============================================================
export const POST = withAuth(async (req, { user }) => {
    try {
        await connectDB();
        const body = await req.json();
        const { type, amount, description, domain, category, eventId, receiptUrl } = body;

        if (!type || !amount || !description || !domain || !category) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const dbUser = await User.findOne({ uid: user.uid }).lean();
        if (!dbUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

        // Permissions logic
        if (type === "budget_allocation" && user.role !== "ga") {
            return NextResponse.json({ success: false, error: "Only GAs can allocate budgets" }, { status: 403 });
        }

        if (user.role === "jga" && domain !== user.domain) {
            return NextResponse.json({ success: false, error: "You can only submit for your own domain" }, { status: 403 });
        }

        const transaction = await Finance.create({
            type,
            amount,
            description,
            domain,
            category,
            eventId: eventId || undefined,
            receiptUrl: receiptUrl || undefined,
            submittedBy: dbUser._id,
            status: type === "budget_allocation" ? "approved" : "pending", // Allocations are auto-approved since GA does it
            approvedBy: type === "budget_allocation" ? dbUser._id : undefined
        });

        return NextResponse.json({ success: true, data: transaction });
    } catch (error) {
        console.error("POST /api/finance error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}, ["ga", "jga", "animator", "volunteer"]);
