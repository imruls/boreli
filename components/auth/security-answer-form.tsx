"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  updateSecurityAnswer,
  type SecurityAnswerState,
} from "@/app/(dashboard)/perfil/seguridad/actions";

const initialState: SecurityAnswerState = { error: null, success: false };

export function SecurityAnswerForm({ hasSecurityAnswer }: { hasSecurityAnswer: boolean }) {
  const [state, formAction, isPending] = useActionState(updateSecurityAnswer, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="securityAnswer">
          {hasSecurityAnswer ? "Nueva respuesta" : "Tu respuesta"}
        </Label>
        <Input
          id="securityAnswer"
          name="securityAnswer"
          type="text"
          autoComplete="off"
          maxLength={200}
          required
        />
        <p className="text-xs text-ink-muted">
          Por seguridad no mostramos la respuesta guardada — si querés cambiarla, escribí la nueva.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Tu contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
        <p className="text-xs text-ink-muted">
          Pedimos tu contraseña para confirmar que sos vos quien cambia la respuesta.
        </p>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success && !isPending ? (
        <div className="flex items-center gap-2 text-sm text-ink">
          <CheckCircle2 className="size-4" />
          <p>Respuesta guardada.</p>
        </div>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar respuesta"}
      </Button>
    </form>
  );
}
