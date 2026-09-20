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

export async function requireEditableOwner(userId: string) {
  const jar = await cookies();
  const requested = jar.get(NOTEBOOK_COOKIE)?.value ?? userId;
  if (requested === userId) return userId;
  if (await canEditNotebook(userId, requested)) return requested;
  return userId;
}

export async function getAccessibleNotebooks(userId: string, userEmail: string) {
  const shares = await prisma.notebookShare.findMany({
    where: { memberId: userId },
    include: { owner: { select: { id: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return [
    { ownerId: userId, email: userEmail, isOwn: true },
    ...shares.map((share) => ({
      ownerId: share.owner.id,
      email: share.owner.email,
      isOwn: false,
    })),
  ];
}

export async function getActiveNotebook(user: { id: string; email: string }) {
  const ownerId = await requireEditableOwner(user.id);
  const notebooks = await getAccessibleNotebooks(user.id, user.email);
  const active = notebooks.find((item) => item.ownerId === ownerId) ?? notebooks[0];
  return { ownerId: active.ownerId, email: active.email, isOwn: active.isOwn, notebooks };
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
