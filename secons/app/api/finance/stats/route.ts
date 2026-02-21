import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Finance from "@/models/Finance";
import { withAuth } from "@/lib/withAuth";

// ============================================================
// GET /api/finance/stats — Aggregate budget vs spent
// ============================================================
export const GET = withAuth(async (req, { user }) => {
    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const domainFilter = searchParams.get("domain");

        // Base pipeline
        let pipeline: any[] = [];

        // Domain filter for JGAs or forced domain
        if (user.role === "jga") {
            pipeline.push({ $match: { domain: user.domain } });
        } else if (user.role === "ga" && domainFilter) {
            pipeline.push({ $match: { domain: domainFilter } });
        }

        pipeline.push({
            $group: {
                _id: "$type",
                total: { $sum: "$amount" }
            }
        });

        const stats = await Finance.aggregate(pipeline);

        const totalBudget = stats.find(s => s._id === "budget_allocation")?.total || 0;
        const totalSpent = stats.find(s => s._id === "expense")?.total || 0;

        // Breakdown by domain (for GAs)
        let domainBreakdown = [];
        if (user.role === "ga") {
            domainBreakdown = await Finance.aggregate([
                {
                    $group: {
                        _id: { domain: "$domain", type: "$type" },
                        total: { $sum: "$amount" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.domain",
                        budget: {
                            $sum: { $cond: [{ $eq: ["$_id.type", "budget_allocation"] }, "$total", 0] }
                        },
                        spent: {
                            $sum: { $cond: [{ $eq: ["$_id.type", "expense"] }, "$total", 0] }
                        }
                    }
                }
            ]);
        }

        return NextResponse.json({
            success: true,
            data: {
                totalBudget,
                totalSpent,
                remaining: totalBudget - totalSpent,
                domainBreakdown
            }
        });
    } catch (error) {
        console.error("GET /api/finance/stats error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}, ["ga", "jga"]);
