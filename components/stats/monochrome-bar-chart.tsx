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
  // "vertical" (default): columnas, para series en el tiempo. "horizontal":
  // barras acostadas con la etiqueta a la izquierda, para categorías con
  // nombres largos (ej. formatos), que en columnas no entran en mobile.
  orientation?: "vertical" | "horizontal";
}

const TICK = { fill: "var(--color-label-secondary)", fontSize: 12 };

// Una sola serie, siempre en `tint` — la paleta de Boreli es intencionalmente
// monocromática (design-system.md), así que acá no hay nada que asignar por
// categoría: el título de cada gráfico ya identifica la serie.
export function MonochromeBarChart({
  data,
  valueLabel,
  height,
  orientation = "vertical",
}: MonochromeBarChartProps) {
  const horizontal = orientation === "horizontal";

  return (
    <ResponsiveContainer width="100%" height={height ?? (horizontal ? data.length * 36 + 24 : 220)}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 8, left: horizontal ? 0 : -4, bottom: 0 }}
        accessibilityLayer={false}
      >
        <CartesianGrid
          vertical={horizontal}
          horizontal={!horizontal}
          stroke="var(--color-separator)"
        />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={TICK} />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={TICK}
              width={108}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--color-separator)" }}
              tick={TICK}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={TICK} width={44} />
          </>
        )}
        <Tooltip
          cursor={{ fill: "var(--color-fill)" }}
          contentStyle={{
            backgroundColor: "var(--color-surface-elevated)",
            border: "none",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgb(0 0 0 / 18%)",
            color: "var(--color-label)",
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--color-label)", fontWeight: 600 }}
          formatter={(value) => [value, valueLabel] as [number, string]}
        />
        <Bar
          dataKey="value"
          fill="var(--color-tint)"
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          maxBarSize={horizontal ? 20 : 32}
          activeBar={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
