import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TransparencyExpense } from "@/types/expense";

export async function getProjectTransparency(projectId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("id, project_id, amount, currency, vendor_name, category, expense_date, receipt_image_url, created_at")
    .eq("project_id", projectId)
    .order("expense_date", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TransparencyExpense[];
}
