import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Finance from "@/models/Finance";
import User from "@/models/User";
import { withAuth } from "@/lib/withAuth";

// ============================================================
// PATCH /api/finance/[id] — Approve/Reject or update
// ============================================================
export const PATCH = withAuth(async (req, { params, user }) => {
    try {
        await connectDB();
        const { id } = params;
        const body = await req.json();

        const transaction = await Finance.findById(id);
        if (!transaction) return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });

        const dbUser = await User.findOne({ uid: user.uid }).select("_id").lean();
        if (!dbUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

        // Update logic
        if (body.status) {
            // Permission check: only GAs or domain-matched JGAs can approve
            if (user.role === "ga" || (user.role === "jga" && transaction.domain === user.domain)) {
                transaction.status = body.status;
                transaction.approvedBy = dbUser._id;
                transaction.approvalNote = body.approvalNote || transaction.approvalNote;
            } else {
                return NextResponse.json({ success: false, error: "Unauthorized to update status" }, { status: 403 });
            }
        }

        // Other updates (description, amount, etc.) - Only if still pending or if GA
        if (transaction.status === "pending" || user.role === "ga") {
            if (body.description) transaction.description = body.description;
            if (body.amount) transaction.amount = body.amount;
            if (body.category) transaction.category = body.category;
            if (body.receiptUrl) transaction.receiptUrl = body.receiptUrl;
        }

        await transaction.save();

        return NextResponse.json({ success: true, data: transaction });
    } catch (error) {
        console.error("PATCH /api/finance/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}, ["ga", "jga"]);

// ============================================================
// DELETE /api/finance/[id] — Remove transaction
// ============================================================
export const DELETE = withAuth(async (req, { params, user }) => {
    try {
        await connectDB();
        const { id } = params;

        const transaction = await Finance.findById(id);
        if (!transaction) return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });

        // Only GA can delete allocations. JGA/GA can delete expenses if they own them or are GAs.
        if (user.role === "ga") {
            await Finance.findByIdAndDelete(id);
        } else if (user.role === "jga") {
            if (transaction.type === "expense" && transaction.status === "pending" && transaction.domain === user.domain) {
                await Finance.findByIdAndDelete(id);
            } else {
                return NextResponse.json({ success: false, error: "Cannot delete approved/other domain expense" }, { status: 403 });
            }
        } else {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({ success: true, message: "Transaction deleted" });
    } catch (error) {
        console.error("DELETE /api/finance/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}, ["ga", "jga"]);
