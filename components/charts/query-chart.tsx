"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface QueryChartProps {
  rows: Array<Record<string, unknown>>;
}

function pickChartColumns(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return null;
  }

  const keys = Object.keys(rows[0]);
  const xKey = keys[0];
  const yKey = keys.find((key) => typeof rows[0][key] === "number");

  if (!xKey || !yKey) {
    return null;
  }

  return { xKey, yKey };
}

export function QueryChart({ rows }: QueryChartProps) {
  const columns = pickChartColumns(rows);

  if (!columns) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Could not infer a chart from the query result. The table output is still available below.
      </div>
    );
  }

  return (
    <div className="h-72 w-full rounded-2xl border border-emerald-100 bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4e6d9" />
          <XAxis dataKey={columns.xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={columns.yKey} fill="#0d8a4e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
