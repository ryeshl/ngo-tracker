"use client";

import { FormEvent, useState } from "react";
import { QueryChart } from "@/components/charts/query-chart";

interface AdminQueryResponse {
  sql: string;
  rows: Array<Record<string, unknown>>;
  error?: string;
}

interface ChatTurn {
  question: string;
  sql?: string;
  rows?: Array<Record<string, unknown>>;
  error?: string;
}

export function AdminChat() {
  const [question, setQuestion] = useState("Show travel expenses for Q1 grouped by month.");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>([]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    const currentQuestion = question.trim();

    try {
      const response = await fetch("/api/admin/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion })
      });

      const payload = (await response.json()) as AdminQueryResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Admin query failed.");
      }

      setHistory((prev) => [
        {
          question: currentQuestion,
          sql: payload.sql,
          rows: payload.rows
        },
        ...prev
      ]);
      setQuestion("");
    } catch (error) {
      setHistory((prev) => [
        {
          question: currentQuestion,
          error: error instanceof Error ? error.message : "Unknown error."
        },
        ...prev
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="grid gap-5 rounded-3xl border border-emerald-100 bg-panel p-5 shadow-sm sm:p-6">
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="text-sm font-medium">Ask analytics in plain language</label>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          className="rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-sm outline-none ring-accent/40 focus:ring"
          placeholder="Show me logistics expenses by category in the last 30 days."
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-fit rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? "Generating Query..." : "Run Query"}
        </button>
      </form>

      <div className="grid gap-4">
        {history.map((turn, index) => (
          <article key={`${turn.question}-${index}`} className="grid gap-3 rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-sm">
              <span className="font-semibold">Question:</span> {turn.question}
            </p>
            {turn.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{turn.error}</p> : null}
            {turn.sql ? (
              <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
                <p className="mb-1 font-semibold text-slate-300">Generated SQL</p>
                <code>{turn.sql}</code>
              </div>
            ) : null}
            {turn.rows && turn.rows.length > 0 ? <QueryChart rows={turn.rows} /> : null}
            {turn.rows && turn.rows.length > 0 ? (
              <div className="overflow-auto rounded-xl border border-emerald-100">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-emerald-50">
                    <tr>
                      {Object.keys(turn.rows[0]).map((key) => (
                        <th key={key} className="px-3 py-2 font-semibold text-muted">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {turn.rows.slice(0, 30).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-emerald-100">
                        {Object.keys(turn.rows![0]).map((key) => (
                          <td key={key} className="px-3 py-2 text-muted">
                            {String(row[key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {turn.rows && turn.rows.length === 0 ? <p className="text-sm text-muted">Query returned no rows.</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
