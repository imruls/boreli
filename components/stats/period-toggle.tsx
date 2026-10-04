"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";

export type Period = "monthly" | "yearly";

interface PeriodToggleProps {
  value: Period;
  onChange: (period: Period) => void;
}

const OPTIONS: { value: Period; label: string }[] = [
  { value: "monthly", label: "Mes" },
  { value: "yearly", label: "Año" },
];

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <SegmentedControl
      aria-label="Período"
      value={value}
      onValueChange={onChange}
      options={OPTIONS}
      className="w-40"
    />
  );
}
