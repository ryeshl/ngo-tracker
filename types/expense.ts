export type ExpenseCategory =
  | "Travel"
  | "Meals"
  | "Accommodation"
  | "Supplies"
  | "Logistics"
  | "Utilities"
  | "Other";

export interface ReceiptExtraction {
  expense_date: string;
  amount: number | null;
  currency: string;
  vendor_name: string;
  category: ExpenseCategory | "Other";
}

export interface QueuedExpenseDraft extends ReceiptExtraction {
  id?: number;
  project_id: string;
  image_base64: string;
  mime_type: string;
  created_at: number;
  retry_count: number;
  last_error?: string;
}

export interface TransparencyExpense {
  id: string;
  project_id: string;
  amount: number;
  currency: string;
  vendor_name: string | null;
  category: string | null;
  expense_date: string;
  receipt_image_url: string | null;
  created_at: string;
}
