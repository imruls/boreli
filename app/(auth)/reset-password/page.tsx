import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LogoMark } from "@/components/brand/logo-mark";

export const metadata: Metadata = {
  title: "Nueva contraseña — Boreli",
};

export default function ResetPasswordPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark />
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold text-ink">Nueva contraseña</h1>
          <p className="text-sm text-ink-muted">Elegí la contraseña que vas a usar para ingresar</p>
        </div>
      </div>
      <ResetPasswordForm />
    </>
  );
}
