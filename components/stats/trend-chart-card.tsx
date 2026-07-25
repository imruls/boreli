"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonochromeBarChart } from "@/components/stats/monochrome-bar-chart";
import { PeriodToggle, type Period } from "@/components/stats/period-toggle";
import type { MonthlyPoint, YearlyPoint } from "@/lib/reading-stats";

interface TrendChartCardProps {
  title: string;
  valueLabel: string;
  monthly: MonthlyPoint[];
  yearly: YearlyPoint[];
}

export function TrendChartCard({ title, valueLabel, monthly, yearly }: TrendChartCardProps) {
  const [period, setPeriod] = useState<Period>("monthly");

  const data =
    period === "monthly"
      ? monthly.map((point) => ({ label: point.label, value: point.value }))
      : yearly.map((point) => ({ label: point.year, value: point.value }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <PeriodToggle value={period} onChange={setPeriod} />
      </CardHeader>
      <CardContent>
        <MonochromeBarChart data={data} valueLabel={valueLabel} />
      </CardContent>
    </Card>
  );
}
