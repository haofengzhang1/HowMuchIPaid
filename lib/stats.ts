import { formatMonthKey, monthKey } from "@/lib/money";

export type ExpenseView = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  note: string;
  spentAt: string;
  personId: string;
  personName: string;
};

export type NamedTotal = {
  label: string;
  value: number;
};

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildStats(expenses: ExpenseView[]) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);

  const allTime = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonth = expenses
    .filter((expense) => new Date(expense.spentAt) >= thisMonthStart)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const byPersonMap = new Map<string, number>();
  const byCategoryMap = new Map<string, number>();
  const byMonthMap = new Map<string, number>();

  for (const expense of expenses) {
    byPersonMap.set(
      expense.personName,
      (byPersonMap.get(expense.personName) ?? 0) + expense.amount,
    );
    byCategoryMap.set(
      expense.category,
      (byCategoryMap.get(expense.category) ?? 0) + expense.amount,
    );
    const key = monthKey(new Date(expense.spentAt));
    byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + expense.amount);
  }

  const months: NamedTotal[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    months.push({
      label: formatMonthKey(key),
      value: byMonthMap.get(key) ?? 0,
    });
  }

  const byPerson: NamedTotal[] = [...byPersonMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const byCategory: NamedTotal[] = [...byCategoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return {
    allTime,
    thisMonth,
    count: expenses.length,
    byPerson,
    byCategory,
    months,
  };
}
