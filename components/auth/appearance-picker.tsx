"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
import { ListRow, ListSection } from "@/components/ui/list";
import { applyThemePreference, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

// Perfil → Apariencia: Sistema / Claro / Oscuro, como selección única con check.
// Aplica el cambio al instante sobre <html> y guarda la cookie; el `refresh`
// hace que el servidor vuelva a generar el color de la barra del navegador.
export function AppearancePicker({ initial }: { initial: ThemePreference }) {
  const router = useRouter();
  const [preference, setPreference] = useState<ThemePreference>(initial);

  function handleChange(next: ThemePreference) {
    setPreference(next);
    applyThemePreference(next);
    router.refresh();
  }

  return (
    <ListSection
      header="Apariencia"
      footer="Sistema usa el modo claro u oscuro que tenga configurado tu dispositivo."
    >
      {OPTIONS.map(({ value, label, icon }) => (
        <ListRow
          key={value}
          icon={icon}
          label={label}
          selected={preference === value}
          onClick={() => handleChange(value)}
        />
      ))}
    </ListSection>
  );
}
