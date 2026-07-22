"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SECURITY_QUESTION } from "@/lib/security-question";
import { deleteAccount, type DeleteAccountState } from "@/app/(dashboard)/perfil/actions";

const initialState: DeleteAccountState = { error: null };

export function DeleteAccountSheet({ hasSecurityAnswer }: { hasSecurityAnswer: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteAccount, initialState);

  return (
    <Sheet open={open} onOpenChange={isPending ? undefined : setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-destructive"
      >
        <Trash2 className="size-4" />
        Eliminar cuenta
      </button>

      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Eliminar cuenta
          </SheetTitle>
          <p className="text-sm text-ink-muted">
            Esta acción no se puede deshacer: se borra tu biblioteca completa y tu cuenta.
          </p>
        </SheetHeader>

        {!hasSecurityAnswer ? (
          <div className="flex flex-col gap-2 px-4">
            <p className="text-sm text-ink-muted">
              Todavía no configuraste una pregunta de seguridad, así que no podemos confirmar tu
              identidad para eliminar la cuenta. Configurala primero desde{" "}
              <Link href="/perfil/seguridad" className="font-medium text-ink underline">
                Seguridad
              </Link>
              .
            </p>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4 px-4">
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
              <Label htmlFor="password">Tu contraseña</Label>
              <PasswordInput id="password" name="password" autoComplete="current-password" required />
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

            <SheetFooter className="px-0">
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Eliminando…" : "Eliminar cuenta definitivamente"}
              </Button>
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
