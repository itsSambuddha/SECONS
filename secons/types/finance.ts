// Types — Finance
// ============================================================

export type FinanceType = "budget_allocation" | "expense";

export type FinanceStatus = "pending" | "approved" | "rejected";

export type ExpenseCategory =
    | "venue"
    | "equipment"
    | "printing"
    | "food_beverages"
    | "decorations"
    | "transport"
    | "prizes"
    | "miscellaneous";

export interface FinanceData {
    _id: string;
    type: FinanceType;
    domain: string;
    eventId?: string;
    amount: number;
    description: string;
    category: ExpenseCategory;
    receiptUrl?: string;
    submittedBy: string;
    approvedBy?: string;
    approvalNote?: string;
    status: FinanceStatus;
    createdAt: Date;
    updatedAt: Date;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    venue: "Venue & Booking",
    equipment: "Equipment",
    printing: "Printing & Stationery",
    food_beverages: "Food & Beverages",
    decorations: "Decorations",
    transport: "Transport",
    prizes: "Prizes & Awards",
    miscellaneous: "Miscellaneous",
};

export const FINANCE_STATUS_LABELS: Record<FinanceStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
};
