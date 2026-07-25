"use client";

import { cn } from "@/lib/utils";

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
    <div className="inline-flex rounded-lg border border-ink-border p-0.5" role="group">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === option.value ? "bg-ink text-cream" : "text-ink-muted hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
