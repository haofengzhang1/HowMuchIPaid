import { prisma } from "@/lib/prisma";

export { DAILY_TEXT_LIMIT, MAX_TEXT_LENGTH } from "@/lib/chat-limits";

export function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function canChat(userId: string, otherId: string) {
  if (!otherId || userId === otherId) return false;
  const share = await prisma.notebookShare.findFirst({
    where: {
      OR: [
        { ownerId: userId, memberId: otherId },
        { ownerId: otherId, memberId: userId },
      ],
    },
    select: { id: true },
  });
  return Boolean(share);
}

export async function listChatContacts(userId: string) {
  const [owned, joined] = await Promise.all([
    prisma.notebookShare.findMany({
      where: { ownerId: userId },
      include: { member: { select: { id: true, email: true, avatarUpdatedAt: true } } },
    }),
    prisma.notebookShare.findMany({
      where: { memberId: userId },
      include: { owner: { select: { id: true, email: true, avatarUpdatedAt: true } } },
    }),
  ]);

  const byId = new Map<string, { id: string; email: string; avatarUpdatedAt: Date | null }>();
  for (const share of owned) {
    byId.set(share.member.id, share.member);
  }
  for (const share of joined) {
    byId.set(share.owner.id, share.owner);
  }
  return [...byId.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function sentTodayCount(userId: string, since?: Date) {
  return prisma.chatMessage.count({
    where: {
      senderId: userId,
      createdAt: { gte: since ?? startOfUtcDay() },
    },
  });
}

export function sanitizeText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export async function getThread(userId: string, otherId: string) {
  const rows = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      senderId: true,
      body: true,
      createdAt: true,
    },
  });
  return rows.reverse();
}

export async function lastMessagesByContact(userId: string, contactIds: string[]) {
  if (contactIds.length === 0) {
    return new Map<string, { body: string; createdAt: Date; fromMe: boolean }>();
  }

  const rows = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: { in: contactIds } },
        { recipientId: userId, senderId: { in: contactIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      senderId: true,
      recipientId: true,
      body: true,
      createdAt: true,
    },
  });

  const latest = new Map<string, { body: string; createdAt: Date; fromMe: boolean }>();
  for (const row of rows) {
    const otherId = row.senderId === userId ? row.recipientId : row.senderId;
    if (!latest.has(otherId)) {
      latest.set(otherId, {
        body: row.body,
        createdAt: row.createdAt,
        fromMe: row.senderId === userId,
      });
    }
  }
  return latest;
}
