"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet, SheetBody, SheetContent, SheetNavBar } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListItem, ListRow, ListSection } from "@/components/ui/list";
import { PasswordInput } from "@/components/ui/password-input";
import { deleteAccount, type DeleteAccountState } from "@/app/(dashboard)/perfil/actions";

const initialState: DeleteAccountState = { error: null };

// Fila destructiva "Eliminar cuenta" (va dentro de una `ListSection`) que abre
// un sheet pidiendo la contraseña actual para confirmar.
export function DeleteAccountSheet() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteAccount, initialState);

  return (
    <>
      <ListRow icon={Trash2} label="Eliminar cuenta" destructive onClick={() => setOpen(true)} />

      <Sheet open={open} onOpenChange={isPending ? undefined : setOpen}>
        <SheetContent>
          <SheetNavBar
            title="Eliminar cuenta"
            leading={
              <Button
                variant="ghost"
                className="font-normal"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
            }
            trailing={
              <Button variant="destructive" type="submit" form="delete-account-form" pending={isPending}>
                Eliminar
              </Button>
            }
          />
          <SheetBody>
            <form id="delete-account-form" action={formAction}>
              <ListSection
                header="Confirmá con tu contraseña"
                footer={
                  state.error ? (
                    <span className="text-destructive">{state.error}</span>
                  ) : (
                    "Esta acción no se puede deshacer: se borra tu biblioteca completa y tu cuenta."
                  )
                }
              >
                <ListItem className="py-0">
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Contraseña"
                    aria-label="Contraseña"
                    required
                    className="rounded-none bg-transparent px-0 focus-visible:ring-0"
                  />
                </ListItem>
              </ListSection>
            </form>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
