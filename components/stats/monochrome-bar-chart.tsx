"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonochromeBarChartProps {
  data: { label: string; value: number }[];
  valueLabel: string;
  height?: number;
}

// Único serie, siempre color "ink" — la paleta de Boreli es intencionalmente
// monocromática (design-system.md), así que acá no hay nada que asignar por
// categoría: el título de cada gráfico ya identifica la serie.
export function MonochromeBarChart({ data, valueLabel, height = 220 }: MonochromeBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        accessibilityLayer={false}
      >
        <CartesianGrid vertical={false} stroke="var(--color-ink-border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "var(--color-ink-border)" }}
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "var(--color-ink-border)", opacity: 0.4 }}
          contentStyle={{
            backgroundColor: "var(--color-cream)",
            border: "1px solid var(--color-ink-border)",
            borderRadius: 8,
            color: "var(--color-ink)",
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--color-ink)", fontWeight: 600 }}
          formatter={(value) => [value, valueLabel] as [number, string]}
        />
        <Bar
          dataKey="value"
          fill="var(--color-ink)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
          activeBar={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
