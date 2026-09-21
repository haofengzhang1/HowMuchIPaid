"use client";

import { useActionState, useRef, useState } from "react";
import { useT } from "@/components/locale-provider";
import { fileToJpegDataUrl } from "@/lib/image-client";
import { CHAT_BG_COLORS } from "@/lib/images";
import { updateAvatar, updateChatBackground, type ProfileState } from "@/lib/profile-actions";

const colorKeys = {
  default: "defaultColor",
  paper: "paper",
  blue: "blue",
  green: "green",
  sand: "sand",
  lilac: "lilac",
  night: "night",
} as const;

export function AccountForm({
  userId,
  email,
  avatarVersion,
  chatBgColor,
  chatBgVersion,
}: {
  userId: string;
  email: string;
  avatarVersion?: string | null;
  chatBgColor: string;
  chatBgVersion?: string | null;
}) {
  const t = useT();
  const [avatarState, avatarAction, avatarPending] = useActionState<ProfileState, FormData>(
    updateAvatar,
    undefined,
  );
  const [bgState, bgAction, bgPending] = useActionState<ProfileState, FormData>(
    updateChatBackground,
    undefined,
  );
  const [avatarData, setAvatarData] = useState("");
  const [bgData, setBgData] = useState("");
  const [preview, setPreview] = useState(avatarVersion ? `/api/avatar/${userId}?v=${avatarVersion}` : "");
  const avatarRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  async function onAvatarFile(file: File | undefined) {
    if (!file) return;
    try {
      const data = await fileToJpegDataUrl(file, { maxEdge: 256, quality: 0.82, square: true });
      setAvatarData(data);
      setPreview(data);
    } catch {
      setAvatarData("");
    }
  }

  async function onBgFile(file: File | undefined) {
    if (!file) return;
    try {
      setBgData(await fileToJpegDataUrl(file, { maxEdge: 1400, quality: 0.72 }));
    } catch {
      setBgData("");
    }
  }

  return (
    <div className="grid gap-4">
      <section className="panel grid gap-3">
        <h2 className="panel-title">{t("profilePhoto")}</h2>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-16 w-16 overflow-hidden rounded-full bg-line">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold">
                {email.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <p className="text-sm text-muted">{t("photoHint")}</p>
        </div>
        <form action={avatarAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="image" value={avatarData} />
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void onAvatarFile(event.currentTarget.files?.[0])}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => avatarRef.current?.click()}
          >
            {t("changePhoto")}
          </button>
          <button type="submit" disabled={avatarPending || !avatarData} className="btn-primary">
            {avatarPending ? t("saving") : t("save")}
          </button>
        </form>
        {avatarVersion ? (
          <form action={avatarAction}>
            <input type="hidden" name="remove" value="1" />
            <button type="submit" className="action-link text-muted hover:text-danger">
              {t("removePhoto")}
            </button>
          </form>
        ) : null}
        {avatarState?.error ? <p className="text-sm text-danger">{avatarState.error}</p> : null}
      </section>

      <section className="panel grid gap-3">
        <h2 className="panel-title">{t("chatBackground")}</h2>
        <form action={bgAction} className="grid gap-3">
          <input type="hidden" name="image" value={bgData} />
          <fieldset className="grid gap-2">
            <legend className="text-sm text-muted">{t("backgroundColor")}</legend>
            <div className="flex flex-wrap gap-2">
              {CHAT_BG_COLORS.map((color) => (
                <label key={color.id} className="flex min-h-10 cursor-pointer items-center gap-2 border border-line px-2">
                  <input
                    type="radio"
                    name="color"
                    value={color.value}
                    defaultChecked={chatBgColor === color.value}
                  />
                  <span
                    className="inline-block h-4 w-4 border border-line"
                    style={{ background: color.value || "var(--bg)" }}
                  />
                  <span className="text-sm">{t(colorKeys[color.id])}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <input
              ref={bgRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => void onBgFile(event.currentTarget.files?.[0])}
            />
            <button type="button" className="btn-secondary" onClick={() => bgRef.current?.click()}>
              {t("changeBackground")}
            </button>
            <button type="submit" disabled={bgPending} className="btn-primary">
              {bgPending ? t("saving") : t("saveBackground")}
            </button>
          </div>
          {bgData ? <p className="text-xs text-muted">{t("backgroundImage")}</p> : null}
        </form>
        {chatBgVersion ? (
          <form action={bgAction}>
            <input type="hidden" name="color" value={chatBgColor} />
            <input type="hidden" name="removeImage" value="1" />
            <button type="submit" className="action-link text-muted hover:text-danger">
              {t("removeBackground")}
            </button>
          </form>
        ) : null}
        {bgState?.error ? <p className="text-sm text-danger">{bgState.error}</p> : null}
        {chatBgVersion ? (
          <div
            className="h-24 border border-line bg-cover bg-center"
            style={{ backgroundImage: `url(/api/chat-bg?v=${chatBgVersion})` }}
          />
        ) : null}
      </section>
    </div>
  );
}
