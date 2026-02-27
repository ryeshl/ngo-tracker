"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface LoginFormProps {
  nextPath: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
        router.push(nextPath || "/expenses/new");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          throw error;
        }
        setFeedback("Account created. Check your email if confirmation is enabled.");
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-emerald-100 bg-panel p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <div className="inline-flex rounded-xl bg-emerald-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-lg px-3 py-1 font-semibold ${mode === "signin" ? "bg-white text-accent shadow-sm" : "text-muted"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-3 py-1 font-semibold ${mode === "signup" ? "bg-white text-accent shadow-sm" : "text-muted"}`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
          required
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-emerald-200 bg-white px-3 py-3 outline-none ring-accent/40 focus:ring"
          required
        />
      </label>

      <button type="submit" disabled={isSubmitting} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isSubmitting ? "Working..." : mode === "signin" ? "Sign In" : "Create Account"}
      </button>

      {feedback ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-muted">{feedback}</p> : null}
    </form>
  );
}
