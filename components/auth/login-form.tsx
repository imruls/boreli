"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type AuthActionState } from "@/app/(auth)/login/actions";

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
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={6}
          required
        />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/signup" className="font-medium text-ink underline underline-offset-4">
          Creá una
        </Link>
      </p>
    </form>
  );
}
