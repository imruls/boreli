"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { signup, type SignupActionState } from "@/app/(auth)/signup/actions";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const initialState: SignupActionState = { error: null };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  if (state.pendingConfirmation) {
    return (
      <div role="status" className="flex w-full flex-col items-center gap-2 text-center">
        <MailCheck className="mb-2 size-12 text-label-secondary" strokeWidth={1.75} aria-hidden />
        <h2 className="text-title-2 text-label">Revisá tu mail</h2>
        <p className="text-body text-label-secondary">
          Te enviamos un link para confirmar tu cuenta. Una vez confirmada, ingresá con tu email y
          contraseña.
        </p>
        <Button asChild size="lg" className="mt-4 w-full">
          <Link href="/login">Ir a ingresar</Link>
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
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          required
        />
        <p className="px-4 text-footnote text-label-secondary">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</p>
      </div>
      {state.error ? (
        <p role="alert" className="px-4 text-footnote text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" pending={isPending} className="mt-2 w-full">
        Crear cuenta
      </Button>
      <p className="text-center text-subheadline text-label-secondary">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-tint underline underline-offset-4">
          Ingresá
        </Link>
      </p>
    </form>
  );
}
