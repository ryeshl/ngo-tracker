import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: { next?: string | string[] };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = typeof searchParams.next === "string" ? searchParams.next : "/expenses/new";

  return (
    <main className="mx-auto grid w-full max-w-xl gap-4">
      <p className="text-sm text-muted">Authenticate with Supabase to access protected admin and API routes.</p>
      <LoginForm nextPath={nextPath} />
    </main>
  );
}
