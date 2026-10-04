"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListItem, ListSection } from "@/components/ui/list";
import { ConfirmationBanner, useConfirmationBanner } from "@/components/ui/confirmation-banner";
import { updateProfile, removeAvatar, type ProfileState } from "@/app/(dashboard)/perfil/editar/actions";

const initialState: ProfileState = { error: null, success: false };

export function ProfileForm({
  email,
  displayName,
  avatarUrl,
}: {
  email: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const [removeState, removeAction, isRemovePending] = useActionState(removeAvatar, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { message: confirmation, show: showConfirmation } = useConfirmationBanner();

  // Misma inicial que en Perfil y en el sidebar: nombre si hay, si no email.
  const initial = (displayName || email).charAt(0).toUpperCase() || "?";
  const currentAvatarUrl = preview ?? avatarUrl;
  const isBusy = isPending || isRemovePending;

  useEffect(() => {
    if (state.success && !isPending) showConfirmation("Perfil actualizado.");
  }, [state.success, isPending, showConfirmation]);

  useEffect(() => {
    if (removeState.success && !isRemovePending) showConfirmation("Foto eliminada.");
  }, [removeState.success, isRemovePending, showConfirmation]);

  const error = state.error ?? removeState.error;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2">
        <Avatar className="size-24">
          {currentAvatarUrl ? <AvatarImage src={currentAvatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-fill text-large-title font-normal text-label-secondary">
            {initial}
          </AvatarFallback>
        </Avatar>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
          }}
        />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {currentAvatarUrl ? "Cambiar foto" : "Agregar foto"}
          </Button>
          {avatarUrl || preview ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isBusy}
              pending={isRemovePending}
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                if (!preview) removeAction(new FormData());
              }}
            >
              Quitar foto
            </Button>
          ) : null}
        </div>
      </div>

      <ListSection
        header="Nombre de usuario"
        footer={
          error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            "Se muestra en tu perfil en vez del email."
          )
        }
      >
        <ListItem className="py-0">
          <Input
            id="displayName"
            name="displayName"
            type="text"
            maxLength={40}
            defaultValue={displayName}
            placeholder={email}
            aria-label="Nombre de usuario"
            className="rounded-none bg-transparent px-0 focus-visible:ring-0"
          />
        </ListItem>
      </ListSection>

      <ConfirmationBanner message={confirmation} />

      <Button type="submit" size="lg" disabled={isBusy} pending={isPending} className="w-full">
        Guardar cambios
      </Button>
    </form>
  );
}
