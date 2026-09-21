"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { AVATAR_MAX_BYTES, CHAT_BG_MAX_BYTES, isChatBgColor, parseImageDataUrl } from "@/lib/images";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export type ProfileState = { error: string } | undefined;

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateAvatar(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const locale = await getLocale();
  const remove = formString(formData, "remove") === "1";
  if (remove) {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null, avatarMime: null, avatarUpdatedAt: null },
    });
    revalidatePath("/", "layout");
    return;
  }

  const parsed = parseImageDataUrl(formString(formData, "image"), AVATAR_MAX_BYTES);
  if (!parsed) return { error: t(locale, "errorPhoto") };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      avatar: parsed.bytes,
      avatarMime: parsed.mime,
      avatarUpdatedAt: new Date(),
    },
  });
  revalidatePath("/", "layout");
}

export async function updateChatBackground(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const locale = await getLocale();
  const color = formString(formData, "color");
  if (!isChatBgColor(color)) return { error: t(locale, "errorBackground") };

  const removeImage = formString(formData, "removeImage") === "1";
  const imageRaw = formString(formData, "image");
  const data: {
    chatBgColor: string;
    chatBg?: Buffer | null;
    chatBgMime?: string | null;
    chatBgUpdatedAt?: Date | null;
  } = { chatBgColor: color };

  if (removeImage) {
    data.chatBg = null;
    data.chatBgMime = null;
    data.chatBgUpdatedAt = null;
  } else if (imageRaw) {
    const parsed = parseImageDataUrl(imageRaw, CHAT_BG_MAX_BYTES);
    if (!parsed) return { error: t(locale, "errorBackground") };
    data.chatBg = parsed.bytes;
    data.chatBgMime = parsed.mime;
    data.chatBgUpdatedAt = new Date();
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });
  revalidatePath("/account");
  revalidatePath("/chat");
}
