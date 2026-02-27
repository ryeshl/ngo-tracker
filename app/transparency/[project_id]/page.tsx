import { getProjectTransparency } from "@/lib/supabase/transparency";
import { TransparencyChart } from "@/components/charts/transparency-chart";

interface TransparencyPageProps {
  params: { project_id: string };
}

function toCumulativeSeries(expenses: Array<{ expense_date: string; amount: number }>) {
  let runningTotal = 0;
  return expenses.map((expense) => {
    runningTotal += Number(expense.amount ?? 0);
    return {
      date: expense.expense_date,
      total: Number(runningTotal.toFixed(2))
    };
  });
}

export default async function TransparencyPage({ params }: TransparencyPageProps) {
  const { project_id: projectId } = params;
  let expenses: Awaited<ReturnType<typeof getProjectTransparency>> = [];
  let loadError: string | null = null;

  try {
    expenses = await getProjectTransparency(projectId);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load transparency data.";
  }

  const totalsByCurrency = expenses.reduce<Record<string, number>>((accumulator, expense) => {
    const code = expense.currency || "GBP";
    accumulator[code] = (accumulator[code] || 0) + Number(expense.amount ?? 0);
    return accumulator;
  }, {});

  const cumulativeSeries = toCumulativeSeries(
    expenses.map((expense) => ({
      expense_date: expense.expense_date,
      amount: Number(expense.amount ?? 0)
    }))
  );

  const receiptUrls = expenses
    .map((expense) => expense.receipt_image_url)
    .filter((url): url is string => Boolean(url));

  return (
    <main className="grid gap-5">
      <section className="rounded-3xl border border-emerald-100 bg-panel p-6 shadow-sm">
        <p className="mb-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
          Public Transparency Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Project {projectId}</h1>
        <p className="mt-2 text-sm text-muted">Cumulative expenditure and receipt proof are published below for sponsor visibility.</p>
      </section>

      <section className="grid gap-3 rounded-3xl border border-emerald-100 bg-panel p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Cumulative Spend</h2>
        {loadError ? (
          <p className="text-sm text-danger">{loadError}</p>
        ) : cumulativeSeries.length > 0 ? (
          <TransparencyChart data={cumulativeSeries} />
        ) : (
          <p className="text-sm text-muted">No expenses recorded yet.</p>
        )}
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-panel p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Totals By Currency</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {Object.entries(totalsByCurrency).length > 0 ? (
            Object.entries(totalsByCurrency).map(([currency, total]) => (
              <li key={currency} className="rounded-lg bg-emerald-50 px-3 py-2 text-muted">
                {currency}: {total.toFixed(2)}
              </li>
            ))
          ) : (
            <li className="text-muted">No total available yet.</li>
          )}
        </ul>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-panel p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Receipt Proof Gallery</h2>
        {receiptUrls.length ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {receiptUrls.map((url, index) => (
              <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-emerald-100 bg-white">
                <img src={url} alt={`Receipt ${index + 1}`} className="h-56 w-full object-cover transition duration-300 group-hover:scale-105" />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No receipt images uploaded yet.</p>
        )}
      </section>
    </main>
  );
}
