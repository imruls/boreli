"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPassword, type ForgotPasswordState } from "@/app/(auth)/forgot-password/actions";
import { SECURITY_QUESTION } from "@/lib/security-question";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const initialState: ForgotPasswordState = { error: null, success: false };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);

  if (state.success) {
    return (
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-8 text-ink" />
        <p className="text-sm text-ink">
          Contraseña actualizada. Ya podés iniciar sesión con la nueva contraseña.
        </p>
        <Button asChild className="mt-2 w-full">
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="securityAnswer">{SECURITY_QUESTION}</Label>
        <Input
          id="securityAnswer"
          name="securityAnswer"
          type="text"
          autoComplete="off"
          maxLength={200}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          required
        />
        <p className="text-xs text-ink-muted">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
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
        {isPending ? "Verificando..." : "Restablecer contraseña"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        ¿Te acordaste?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
