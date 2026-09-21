"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { canChat, sanitizeText } from "@/lib/chat";
import { DAILY_TEXT_LIMIT, MAX_TEXT_LENGTH } from "@/lib/chat-limits";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { startOfUserDay } from "@/lib/timezone";

export type ChatState = { error: string } | undefined;

function hasFileUpload(formData: FormData) {
  for (const value of formData.values()) {
    if (typeof File !== "undefined" && value instanceof File && value.size > 0) {
      return true;
    }
  }
  return false;
}

export async function sendChatMessage(
  _prev: ChatState,
  formData: FormData,
): Promise<ChatState> {
  const user = await requireUser();
  const locale = await getLocale();
  if (hasFileUpload(formData)) {
    return { error: t(locale, "errorChatFiles") };
  }

  const recipientId = String(formData.get("recipientId") ?? "").trim();
  if (!(await canChat(user.id, recipientId))) {
    return { error: t(locale, "errorChatShare") };
  }

  const body = sanitizeText(String(formData.get("body") ?? ""));
  if (!body) return { error: t(locale, "errorChatEmpty") };
  if (body.length > MAX_TEXT_LENGTH) {
    return { error: t(locale, "errorChatLength", { limit: MAX_TEXT_LENGTH }) };
  }

  const since = await startOfUserDay();
  try {
    await prisma.$transaction(async (tx) => {
      const sent = await tx.chatMessage.count({
        where: {
          senderId: user.id,
          createdAt: { gte: since },
        },
      });
      if (sent >= DAILY_TEXT_LIMIT) {
        throw new Error("DAILY_LIMIT");
      }
      await tx.chatMessage.create({
        data: {
          senderId: user.id,
          recipientId,
          body,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_LIMIT") {
      return { error: t(locale, "errorChatLimit", { limit: DAILY_TEXT_LIMIT }) };
    }
    throw error;
  }

  revalidatePath("/chat");
  revalidatePath(`/chat/${recipientId}`);
}
