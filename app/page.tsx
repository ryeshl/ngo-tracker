import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid gap-6">
      <section className="rounded-3xl border border-emerald-100 bg-panel p-7 shadow-sm">
        <p className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
          PWA + Offline Sync
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Financial Tracking For Field Teams, Built For Low Connectivity
        </h1>
        <p className="mt-3 max-w-3xl text-muted">
          Capture expenses with receipt proof, scan values with AI, sync when online, and publish transparent project spending to sponsors.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/expenses/new" className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            Capture Expense
          </Link>
          <Link href="/admin" className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-accent transition hover:bg-emerald-50">
            Open Admin Dashboard
          </Link>
        </div>
      </section>
      <section className="rounded-3xl border border-emerald-100 bg-panel p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Public Transparency Route</h2>
        <p className="mt-2 text-muted">
          Example dynamic route: <code className="rounded bg-emerald-50 px-1 py-0.5">/transparency/PROJECT-001</code>
        </p>
      </section>
    </main>
  );
}
