"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
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
      {state.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-ink-border bg-ink-border/30 px-3 py-2.5 text-sm text-ink">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-muted" />
          <p>{state.error}</p>
        </div>
      ) : null}
      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Ingresando..." : "Iniciar sesión"}
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
