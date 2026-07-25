import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserBooksByStatus } from "@/lib/queries/user-books";
import {
  getMonthlyPagesRead,
  getMonthlyReadCounts,
  getRatingDistribution,
  getTagDistribution,
  getYearlyPagesRead,
  getYearlyReadCounts,
} from "@/lib/reading-stats";
import { PageHeader } from "@/components/nav/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatSection } from "@/components/stats/stat-section";
import { TrendChartCard } from "@/components/stats/trend-chart-card";
import { MonochromeBarChart } from "@/components/stats/monochrome-bar-chart";

export const metadata: Metadata = {
  title: "Estadísticas — Boreli",
};

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const readBooks = user ? await getUserBooksByStatus(supabase, user.id, "read") : [];

  if (readBooks.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
        <PageHeader title="Estadísticas" backHref="/perfil" />
        <EmptyState
          icon={BarChart3}
          title="Todavía no hay libros leídos"
          description="Marcá libros como leídos para ver tus estadísticas de lectura acá."
        />
      </div>
    );
  }

  const monthlyCounts = getMonthlyReadCounts(readBooks);
  const yearlyCounts = getYearlyReadCounts(readBooks);
  const monthlyPages = getMonthlyPagesRead(readBooks);
  const yearlyPages = getYearlyPagesRead(readBooks);
  const tagDistribution = getTagDistribution(readBooks);
  const ratingDistribution = getRatingDistribution(readBooks);

  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <PageHeader title="Estadísticas" backHref="/perfil" />

      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <TrendChartCard
          title="Libros leídos"
          valueLabel="libros"
          monthly={monthlyCounts}
          yearly={yearlyCounts}
        />

        <TrendChartCard
          title="Páginas leídas"
          valueLabel="páginas"
          monthly={monthlyPages}
          yearly={yearlyPages}
        />

        <StatSection title="Formato de lectura">
          <MonochromeBarChart
            data={tagDistribution.map((point) => ({ label: point.label, value: point.count }))}
            valueLabel="libros"
          />
        </StatSection>

        <StatSection title="Distribución de calificaciones">
          <MonochromeBarChart
            data={ratingDistribution.map((point) => ({
              label: `${point.rating}★`,
              value: point.count,
            }))}
            valueLabel="libros"
          />
        </StatSection>
      </div>
    </div>
  );
}
