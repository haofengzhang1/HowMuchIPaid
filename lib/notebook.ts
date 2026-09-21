import { householdOwnerIds } from "@/lib/access";
import { t, type Locale } from "@/lib/i18n";
import { ensureNotebookPeople, ensurePerson, personLabel } from "@/lib/participants";
import { prisma } from "@/lib/prisma";
import type { ExpenseView } from "@/lib/stats";

export async function getNotebook(ownerId: string, currentUserId?: string, locale: Locale = "en") {
  await ensureNotebookPeople(ownerId);
  const ownerIds = await householdOwnerIds(ownerId);

  for (const id of ownerIds) {
    if (id === ownerId) continue;
    const member = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (member) await ensurePerson(id, { email: member.email, userId: member.id });
  }

  const [people, expenses] = await Promise.all([
    prisma.person.findMany({
      where: { ownerId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { expenses: true } } },
    }),
    prisma.expense.findMany({
      where: { ownerId: { in: ownerIds } },
      include: { person: true },
      orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const peopleByUserId = new Map(
    people.filter((person) => person.userId).map((person) => [person.userId as string, person.id]),
  );
  const peopleByName = new Map(people.map((person) => [person.name, person.id]));

  const expenseViews: ExpenseView[] = expenses.map((expense) => ({
    id: expense.id,
    amount: Number(expense.amount),
    currency: expense.currency,
    category: expense.category,
    note: expense.note,
    spentAt: expense.spentAt.toISOString(),
    personId:
      (expense.person.userId ? peopleByUserId.get(expense.person.userId) : undefined) ??
      peopleByName.get(expense.person.name) ??
      expense.personId,
    personName: currentUserId
      ? personLabel(expense.person, currentUserId, {
          you: t(locale, "you"),
          invited: (email) => t(locale, "invitedSuffix", { email }),
        })
      : expense.person.name,
  }));

  return { people, expenses: expenseViews };
}
