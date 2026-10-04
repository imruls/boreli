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
          <h1 className="text-title-1 text-label">Nueva contraseña</h1>
          <p className="text-body text-label-secondary">Elegí la contraseña que vas a usar para ingresar</p>
        </div>
      </div>
      <ResetPasswordForm />
    </>
  );
}
