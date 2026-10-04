"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
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
      <div role="status" className="flex w-full flex-col items-center gap-2 text-center">
        <MailCheck className="mb-2 size-12 text-label-secondary" strokeWidth={1.75} aria-hidden />
        <h2 className="text-title-2 text-label">Revisá tu mail</h2>
        <p className="text-body text-label-secondary">
          Si el email tiene una cuenta, te enviamos un link para elegir una nueva contraseña.
          Abrilo desde este mismo navegador.
        </p>
        <Button asChild variant="secondary" size="lg" className="mt-4 w-full">
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
        <p role="alert" className="px-4 text-footnote text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" pending={isPending} className="mt-2 w-full">
        Enviar link de recuperación
      </Button>
      <p className="text-center text-subheadline text-label-secondary">
        ¿Te acordaste?{" "}
        <Link href="/login" className="font-semibold text-tint underline underline-offset-4">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
