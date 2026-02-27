import { redirect } from "next/navigation";
import { AdminChat } from "@/components/admin/admin-chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const adminFlag =
    user.app_metadata?.role === "admin" ||
    user.user_metadata?.role === "admin" ||
    user.user_metadata?.is_admin === true;

  if (!adminFlag) {
    return (
      <main className="rounded-3xl border border-red-100 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-800">Admin access required</h1>
        <p className="mt-2 text-sm text-red-700">
          Set <code>app_metadata.role = &quot;admin&quot;</code> (or <code>user_metadata.is_admin = true</code>) for this user in Supabase Auth.
        </p>
      </main>
    );
  }

  return (
    <main className="grid gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Admin Analytics</h1>
      <p className="text-sm text-muted">
        Ask natural-language questions. Gemini generates guarded read-only SQL and the app renders charts from returned rows.
      </p>
      <AdminChat />
    </main>
  );
}
