"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { signup } from "@/app/(auth)/signup/actions";
import type { AuthActionState } from "@/app/(auth)/login/actions";
import { SECURITY_QUESTION } from "@/lib/security-question";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const initialState: AuthActionState = { error: null };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          required
        />
        <p className="text-xs text-ink-muted">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="securityAnswer">Pregunta de seguridad</Label>
        <p className="text-xs text-ink-muted">
          La vas a necesitar si alguna vez olvidás tu contraseña: {SECURITY_QUESTION}
        </p>
        <Input
          id="securityAnswer"
          name="securityAnswer"
          type="text"
          autoComplete="off"
          maxLength={200}
          required
        />
      </div>
      {state.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-ink-border bg-ink-border/30 px-3 py-2.5 text-sm text-ink">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-muted" />
          <p>{state.error}</p>
        </div>
      ) : null}
      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Ingresá
        </Link>
      </p>
    </form>
  );
}
