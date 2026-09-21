"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { canChat, sanitizeText, startOfUtcDay } from "@/lib/chat";
import { DAILY_TEXT_LIMIT, MAX_TEXT_LENGTH } from "@/lib/chat-limits";
import { prisma } from "@/lib/prisma";

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
  if (hasFileUpload(formData)) {
    return { error: "Text only. Photos and videos are not allowed." };
  }

  const recipientId = String(formData.get("recipientId") ?? "").trim();
  if (!(await canChat(user.id, recipientId))) {
    return { error: "You can only text people who share a log with you." };
  }

  const body = sanitizeText(String(formData.get("body") ?? ""));
  if (!body) return { error: "Write a message." };
  if (body.length > MAX_TEXT_LENGTH) {
    return { error: `Keep it under ${MAX_TEXT_LENGTH} characters.` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sent = await tx.chatMessage.count({
        where: {
          senderId: user.id,
          createdAt: { gte: startOfUtcDay() },
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
      return { error: `You can send ${DAILY_TEXT_LIMIT} texts per day.` };
    }
    throw error;
  }

  revalidatePath("/chat");
  revalidatePath(`/chat/${recipientId}`);
}
