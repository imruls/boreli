"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { login, type AuthActionState } from "@/app/(auth)/login/actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const initialState: AuthActionState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="/forgot-password" className="pr-4 text-footnote font-semibold text-tint">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
        />
      </div>
      {state.error ? (
        <p role="alert" className="px-4 text-footnote text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" pending={isPending} className="mt-2 w-full">
        Iniciar sesión
      </Button>
      <p className="text-center text-subheadline text-label-secondary">
        ¿No tenés cuenta?{" "}
        <Link href="/signup" className="font-semibold text-tint underline underline-offset-4">
          Creá una
        </Link>
      </p>
    </form>
  );
}
