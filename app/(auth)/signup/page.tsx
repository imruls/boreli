import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";
import { LogoMark } from "@/components/brand/logo-mark";

export const metadata: Metadata = {
  title: "Crear cuenta — Boreli",
};

export default function SignupPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoMark />
        <div className="flex flex-col gap-1">
          <h1 className="text-title-1 text-label">Creá tu cuenta</h1>
          <p className="text-body text-label-secondary">Registrate para empezar a armar tu biblioteca</p>
        </div>
      </div>
      <SignupForm />
    </>
  );
}
