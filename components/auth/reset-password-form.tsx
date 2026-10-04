"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { updatePassword, type ResetPasswordState } from "@/app/(auth)/reset-password/actions";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const initialState: ResetPasswordState = { error: null };

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
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
        <p className="px-4 text-footnote text-label-secondary">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</p>
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
        <p role="alert" className="px-4 text-footnote text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" pending={isPending} className="mt-2 w-full">
        Guardar contraseña
      </Button>
    </form>
  );
}
