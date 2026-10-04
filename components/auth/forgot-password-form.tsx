"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/app/(auth)/forgot-password/actions";

const initialState: ForgotPasswordState = { error: null, success: false };

export function ForgotPasswordForm({ linkExpired }: { linkExpired: boolean }) {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <MailCheck className="size-8 text-ink" />
        <p className="text-sm text-ink">
          Si el email tiene una cuenta, te enviamos un link para elegir una nueva contraseña.
          Abrilo desde este mismo navegador.
        </p>
        <Button asChild variant="outline" className="mt-2 w-full">
          <Link href="/login">Volver a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  const error =
    state.error ?? (linkExpired ? "El link expiró o ya fue usado. Pedí uno nuevo." : null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-ink-border bg-ink-border/30 px-3 py-2.5 text-sm text-ink">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-muted" />
          <p>{error}</p>
        </div>
      ) : null}
      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Enviando..." : "Enviar link de recuperación"}
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
