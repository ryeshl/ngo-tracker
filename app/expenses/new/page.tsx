import { redirect } from "next/navigation";
import { ExpenseCaptureForm } from "@/components/expenses/expense-capture-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewExpensePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/expenses/new");
  }

  return (
    <main className="grid gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Capture Field Expense</h1>
      <p className="text-sm text-muted">
        This flow works offline: data is queued locally and synced securely to Supabase when connectivity returns.
      </p>
      <ExpenseCaptureForm />
    </main>
  );
}
