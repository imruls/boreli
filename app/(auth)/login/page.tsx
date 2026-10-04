import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { LogoMark } from "@/components/brand/logo-mark";

export const metadata: Metadata = {
  title: "Iniciar sesión — Boreli",
};

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark />
        <div className="flex flex-col gap-1">
          <h1 className="text-title-1 text-label">¡Bienvenido a Boreli!</h1>
          <p className="text-body text-label-secondary">Iniciá sesión para continuar</p>
        </div>
      </div>
      <LoginForm />
    </>
  );
}
