import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — Boreli",
};

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-heading text-sm font-bold tracking-wide text-ink uppercase">
          Boreli
        </span>
        <h1 className="font-heading text-2xl font-bold text-ink">Iniciar sesión</h1>
      </div>
      <LoginForm />
    </>
  );
}
