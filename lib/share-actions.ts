"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  canEditNotebook,
  getInviteOrigin,
  invitePath,
  setActiveNotebook,
} from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ShareState = { error: string } | { url: string } | undefined;

const emailSchema = z.email("Enter a valid email.").max(200);

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function refreshSharing() {
  revalidatePath("/sharing");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/people");
}

async function grantShare(ownerId: string, memberId: string) {
  await prisma.notebookShare.upsert({
    where: { ownerId_memberId: { ownerId, memberId } },
    update: {},
    create: { ownerId, memberId },
  });
}

export async function createInvite(
  _prev: ShareState,
  formData: FormData,
): Promise<ShareState> {
  const user = await requireUser();
  const parsed = emailSchema.safeParse(formString(formData, "email").toLowerCase());
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }
  if (parsed.data === user.email) {
    return { error: "You already have access to your own log." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data },
    select: { id: true },
  });
  if (existingUser) {
    const already = await prisma.notebookShare.findUnique({
      where: { ownerId_memberId: { ownerId: user.id, memberId: existingUser.id } },
      select: { id: true },
    });
    if (already) return { error: "That person already has access." };
  }

  let invite = await prisma.invite.findFirst({
    where: { ownerId: user.id, email: parsed.data, status: "pending" },
  });
  if (!invite) {
    invite = await prisma.invite.create({
      data: {
        ownerId: user.id,
        email: parsed.data,
        token: randomBytes(18).toString("base64url"),
      },
    });
  }

  refreshSharing();
  const origin = await getInviteOrigin();
  return { url: `${origin}${invitePath(invite.token)}` };
}

export async function acceptInvite(formData: FormData) {
  const user = await requireUser();
  const token = formString(formData, "token");
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { owner: { select: { id: true, email: true } } },
  });
  if (!invite || invite.status === "revoked") {
    return;
  }
  if (invite.email !== user.email) {
    return;
  }
  if (invite.ownerId === user.id) {
    return;
  }

  await grantShare(invite.ownerId, user.id);
  if (invite.status === "pending") {
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });
  }
  await setActiveNotebook(invite.ownerId);
  refreshSharing();
  redirect("/dashboard");
}

export async function declineInvite(formData: FormData) {
  const user = await requireUser();
  const id = formString(formData, "id");
  await prisma.invite.updateMany({
    where: { id, email: user.email, status: "pending" },
    data: { status: "declined" },
  });
  refreshSharing();
}

export async function revokeInvite(formData: FormData) {
  const user = await requireUser();
  const id = formString(formData, "id");
  await prisma.invite.updateMany({
    where: { id, ownerId: user.id, status: "pending" },
    data: { status: "revoked" },
  });
  refreshSharing();
}

export async function removeMember(formData: FormData) {
  const user = await requireUser();
  const memberId = formString(formData, "memberId");
  await prisma.notebookShare.deleteMany({
    where: { ownerId: user.id, memberId },
  });
  refreshSharing();
}

export async function leaveNotebook(formData: FormData) {
  const user = await requireUser();
  const ownerId = formString(formData, "ownerId");
  await prisma.notebookShare.deleteMany({
    where: { ownerId, memberId: user.id },
  });
  await setActiveNotebook(user.id);
  refreshSharing();
}

export async function switchNotebook(formData: FormData) {
  const user = await requireUser();
  const ownerId = formString(formData, "ownerId");
  if (!(await canEditNotebook(user.id, ownerId))) {
    return;
  }
  await setActiveNotebook(ownerId);
  refreshSharing();
}
