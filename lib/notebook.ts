import { prisma } from "@/lib/prisma";
import type { ExpenseView } from "@/lib/stats";

export async function getNotebook(userId: string) {
  const [people, expenses] = await Promise.all([
    prisma.person.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { expenses: true } } },
    }),
    prisma.expense.findMany({
      where: { ownerId: userId },
      include: { person: true },
      orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const expenseViews: ExpenseView[] = expenses.map((expense) => ({
    id: expense.id,
    amount: Number(expense.amount),
    currency: expense.currency,
    category: expense.category,
    note: expense.note,
    spentAt: expense.spentAt.toISOString(),
    personId: expense.personId,
    personName: expense.person.name,
  }));

  return { people, expenses: expenseViews };
}
