import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const NOTEBOOK_COOKIE = "hmip_notebook";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function setActiveNotebook(ownerId: string) {
  const jar = await cookies();
  jar.set(NOTEBOOK_COOKIE, ownerId, cookieOptions());
}

export async function clearActiveNotebook() {
  const jar = await cookies();
  jar.delete(NOTEBOOK_COOKIE);
}

export async function canEditNotebook(userId: string, ownerId: string) {
  if (userId === ownerId) return true;
  const share = await prisma.notebookShare.findUnique({
    where: { ownerId_memberId: { ownerId, memberId: userId } },
    select: { id: true },
  });
  return Boolean(share);
}

export async function householdOwnerIds(canonicalOwnerId: string) {
  const members = await prisma.notebookShare.findMany({
    where: { ownerId: canonicalOwnerId },
    select: { memberId: true },
  });
  return [canonicalOwnerId, ...members.map((share) => share.memberId)];
}

export async function getAccessibleNotebooks(userId: string, userEmail: string) {
  const [shares, ownedCount] = await Promise.all([
    prisma.notebookShare.findMany({
      where: { memberId: userId },
      include: { owner: { select: { id: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.notebookShare.count({ where: { ownerId: userId } }),
  ]);

  const notebooks: { ownerId: string; email: string; isOwn: boolean }[] = [];
  const memberOnly = shares.length > 0 && ownedCount === 0;
  if (!memberOnly) {
    notebooks.push({ ownerId: userId, email: userEmail, isOwn: true });
  }
  for (const share of shares) {
    notebooks.push({
      ownerId: share.owner.id,
      email: share.owner.email,
      isOwn: false,
    });
  }
  return notebooks;
}

export async function requireEditableOwner(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const notebooks = await getAccessibleNotebooks(userId, user?.email ?? "");
  const jar = await cookies();
  const requested = jar.get(NOTEBOOK_COOKIE)?.value;
  return notebooks.find((item) => item.ownerId === requested)?.ownerId ?? notebooks[0]?.ownerId ?? userId;
}

export async function getActiveNotebook(user: { id: string; email: string }) {
  const notebooks = await getAccessibleNotebooks(user.id, user.email);
  const jar = await cookies();
  const requested = jar.get(NOTEBOOK_COOKIE)?.value;
  const active = notebooks.find((item) => item.ownerId === requested) ?? notebooks[0];
  const members = await prisma.notebookShare.findMany({
    where: { ownerId: active.ownerId },
    include: { member: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });
  const sharedWith = members.map((share) => share.member.email);
  return {
    ownerId: active.ownerId,
    email: active.email,
    isOwn: active.isOwn,
    isShared: sharedWith.length > 0 || !active.isOwn,
    sharedWith,
    notebooks,
  };
}

export async function getInviteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function invitePath(token: string) {
  return `/invite/${token}`;
}

export function isSafeInvitePath(value: string) {
  return /^\/invite\/[A-Za-z0-9_-]+$/.test(value);
}
