import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Crear cuenta — Boreli",
};

export default function SignupPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-heading text-sm font-bold tracking-wide text-ink uppercase">
          Boreli
        </span>
        <h1 className="font-heading text-2xl font-bold text-ink">Crear cuenta</h1>
      </div>
      <SignupForm />
    </>
  );
}
