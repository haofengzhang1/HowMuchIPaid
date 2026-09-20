import { prisma } from "@/lib/prisma";

export async function mergeDuplicatePeople(ownerId: string) {
  const people = await prisma.person.findMany({
    where: { ownerId },
    include: { _count: { select: { expenses: true } } },
    orderBy: { createdAt: "asc" },
  });
  const groups = new Map<string, typeof people>();
  for (const person of people) {
    const key = person.name.trim().toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(person);
    groups.set(key, list);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keep =
      group.find((person) => person.userId) ??
      group.reduce((best, person) =>
        person._count.expenses > best._count.expenses ? person : best,
      );
    for (const extra of group) {
      if (extra.id === keep.id) continue;
      await prisma.expense.updateMany({
        where: { personId: extra.id },
        data: { personId: keep.id },
      });
      await prisma.person.deleteMany({ where: { id: extra.id } });
    }
  }
}

export async function ensurePerson(
  ownerId: string,
  account: { email: string; userId?: string },
) {
  if (account.userId) {
    const linked = await prisma.person.findFirst({
      where: { ownerId, userId: account.userId },
    });
    if (linked) {
      if (linked.name !== account.email) {
        return prisma.person.update({
          where: { id: linked.id },
          data: { name: account.email },
        });
      }
      return linked;
    }
  }

  const byEmail = await prisma.person.findFirst({
    where: { ownerId, name: account.email },
  });
  if (byEmail) {
    if (account.userId && byEmail.userId !== account.userId) {
      return prisma.person.update({
        where: { id: byEmail.id },
        data: { userId: account.userId },
      });
    }
    return byEmail;
  }

  if (account.userId === ownerId) {
    const unnamed = await prisma.person.findFirst({
      where: { ownerId, userId: null, name: "Me" },
    });
    if (unnamed) {
      return prisma.person.update({
        where: { id: unnamed.id },
        data: { name: account.email, userId: account.userId },
      });
    }
  }

  try {
    return await prisma.person.create({
      data: {
        ownerId,
        name: account.email,
        userId: account.userId,
      },
    });
  } catch {
    const existing = await prisma.person.findFirst({
      where: { ownerId, name: account.email },
    });
    if (existing) return existing;
    throw new Error("Could not add that person to the log.");
  }
}

export async function ensureNotebookPeople(ownerId: string) {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { id: true, email: true },
  });
  if (!owner) return;

  await mergeDuplicatePeople(ownerId);
  await ensurePerson(ownerId, { email: owner.email, userId: owner.id });

  const [members, pending] = await Promise.all([
    prisma.notebookShare.findMany({
      where: { ownerId },
      include: { member: { select: { id: true, email: true } } },
    }),
    prisma.invite.findMany({
      where: { ownerId, status: "pending" },
      select: { email: true },
    }),
  ]);

  const memberEmails = new Set(members.map((share) => share.member.email));
  for (const share of members) {
    await ensurePerson(ownerId, {
      email: share.member.email,
      userId: share.member.id,
    });
  }
  for (const invite of pending) {
    if (memberEmails.has(invite.email)) continue;
    await ensurePerson(ownerId, { email: invite.email });
  }
  await mergeDuplicatePeople(ownerId);
}

export async function removeUnusedPerson(ownerId: string, email: string) {
  const person = await prisma.person.findFirst({
    where: { ownerId, name: email },
    include: { _count: { select: { expenses: true } } },
  });
  if (!person || person._count.expenses > 0) return;
  if (person.userId === ownerId) return;
  await prisma.person.delete({ where: { id: person.id } });
}

export function personLabel(
  person: { name: string; userId: string | null },
  currentUserId: string,
) {
  if (person.userId === currentUserId) return "You";
  if (!person.userId && person.name.includes("@")) return `${person.name} (invited)`;
  return person.name;
}
