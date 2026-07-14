import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LogoMark } from "@/components/brand/logo-mark";

export const metadata: Metadata = {
  title: "Recuperar contraseña — Boreli",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark />
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold text-ink">Recuperar contraseña</h1>
          <p className="text-sm text-ink-muted">
            Verificamos tu identidad con la pregunta de seguridad que definiste al crear la cuenta.
          </p>
        </div>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
