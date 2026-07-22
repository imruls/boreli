import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { userHasSecurityAnswer } from "@/lib/security-answer-store";
import { PageHeader } from "@/components/nav/page-header";
import { SecurityAnswerForm } from "@/components/auth/security-answer-form";
import { SECURITY_QUESTION } from "@/lib/security-question";

export const metadata: Metadata = {
  title: "Seguridad — Boreli",
};

export default async function SeguridadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const hasSecurityAnswer = await userHasSecurityAnswer(supabase);

  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <PageHeader title="Seguridad" backHref="/perfil" />

      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-ink">
            Pregunta de seguridad: <span className="font-medium">{SECURITY_QUESTION}</span>
          </p>
          <p className="text-sm text-ink-muted">
            Se usa para restablecer tu contraseña sin email desde{" "}
            <span className="font-medium text-ink">¿Olvidaste tu contraseña?</span> en el login.
            {hasSecurityAnswer
              ? " Ya tenés una respuesta guardada."
              : " Todavía no configuraste una respuesta."}
          </p>
        </div>
        <SecurityAnswerForm hasSecurityAnswer={hasSecurityAnswer} />
      </div>
    </div>
  );
}
