import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LogoMark } from "@/components/brand/logo-mark";

export const metadata: Metadata = {
  title: "Recuperar contraseña — Boreli",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark />
        <div className="flex flex-col gap-1">
          <h1 className="text-title-1 text-label">Recuperar contraseña</h1>
          <p className="text-body text-label-secondary">
            Te enviamos un link por mail para elegir una nueva contraseña.
          </p>
        </div>
      </div>
      <ForgotPasswordForm linkExpired={error === "link-expired"} />
    </>
  );
}
