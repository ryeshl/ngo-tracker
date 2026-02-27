"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface CumulativePoint {
  date: string;
  total: number;
}

interface TransparencyChartProps {
  data: CumulativePoint[];
}

export function TransparencyChart({ data }: TransparencyChartProps) {
  return (
    <div className="h-72 w-full rounded-2xl border border-emerald-100 bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d8a4e" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#0d8a4e" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d4e6d9" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="total" stroke="#0d8a4e" fill="url(#spendGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
