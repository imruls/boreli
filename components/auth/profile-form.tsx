"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const initial = email ? email.charAt(0).toUpperCase() : "?";
  const currentAvatarUrl = preview ?? avatarUrl;
  const isBusy = isPending || isRemovePending;

  useEffect(() => {
    if (state.success && !isPending) showConfirmation("Perfil actualizado.");
  }, [state.success, isPending, showConfirmation]);

  useEffect(() => {
    if (removeState.success && !isRemovePending) showConfirmation("Foto eliminada.");
  }, [removeState.success, isRemovePending, showConfirmation]);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar className="size-20">
            {currentAvatarUrl ? <AvatarImage src={currentAvatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-ink-border text-2xl text-ink">{initial}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            aria-label="Cambiar foto de perfil"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -right-1.5 -bottom-1.5 flex size-9 items-center justify-center rounded-full border border-ink-border bg-cream text-ink"
          >
            <Camera className="size-4" />
          </button>
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
        </div>

        {avatarUrl || preview ? (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              if (!preview) removeAction(new FormData());
            }}
            disabled={isBusy}
            className="text-xs font-medium text-ink-muted underline disabled:opacity-50"
          >
            {isRemovePending ? "Quitando…" : "Quitar foto"}
          </button>
        ) : null}

        <div className="flex w-full flex-col gap-1.5 pt-4">
          <Label htmlFor="displayName">Nombre de usuario</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            maxLength={40}
            defaultValue={displayName}
            placeholder={email}
          />
          <p className="text-xs text-ink-muted">Se muestra en tu perfil en vez del email.</p>
        </div>

        {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
        {removeState.error ? (
          <p className="w-full text-sm text-destructive">{removeState.error}</p>
        ) : null}
        <ConfirmationBanner message={confirmation} className="w-full" />

        <Button type="submit" disabled={isBusy} className="mt-2 w-full">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
