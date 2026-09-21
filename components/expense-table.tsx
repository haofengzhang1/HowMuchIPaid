"use client";

import { useState } from "react";
import { ExpenseDialog } from "@/components/expense-dialog";
import { ExpenseForm } from "@/components/expense-form";
import { useLocale, useT } from "@/components/locale-provider";
import { deleteExpense } from "@/lib/actions";
import { categoryLabel } from "@/lib/i18n";
import { formatDay, formatMoney } from "@/lib/money";
import type { ExpenseView } from "@/lib/stats";

type PersonOption = { id: string; name: string };

export function ExpenseTable({
  expenses,
  people,
  empty,
}: {
  expenses: ExpenseView[];
  people: PersonOption[];
  empty: string;
}) {
  const [editing, setEditing] = useState<ExpenseView | null>(null);
  const t = useT();
  const locale = useLocale();

  if (expenses.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <>
      <ul className="grid gap-0 md:hidden">
        {expenses.map((expense) => (
          <li key={expense.id} className="border-b border-line py-3 last:border-b-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium tabular-nums">
                  {formatMoney(expense.amount, expense.currency, locale)}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {formatDay(expense.spentAt, locale)} · {expense.personName} · {categoryLabel(locale, expense.category)}
                </p>
                {expense.note ? (
                  <p className="mt-1 truncate text-sm text-muted">{expense.note}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <button
                  type="button"
                  className="action-link text-accent"
                  onClick={() => setEditing(expense)}
                >
                  {t("edit")}
                </button>
                <form action={deleteExpense}>
                  <input type="hidden" name="id" value={expense.id} />
                  <button type="submit" className="action-link text-muted hover:text-danger">
                    {t("delete")}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 font-medium">{t("date")}</th>
              <th className="py-2 font-medium">{t("who")}</th>
              <th className="py-2 font-medium">{t("category")}</th>
              <th className="py-2 font-medium">{t("note")}</th>
              <th className="py-2 text-right font-medium">{t("amount")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-line/70">
                <td className="py-2">{formatDay(expense.spentAt, locale)}</td>
                <td className="py-2">{expense.personName}</td>
                <td className="py-2">{categoryLabel(locale, expense.category)}</td>
                <td className="max-w-48 truncate py-2 text-muted">{expense.note || "—"}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(expense.amount, expense.currency, locale)}
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="text-xs text-accent"
                      onClick={() => setEditing(expense)}
                    >
                      {t("edit")}
                    </button>
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={expense.id} />
                      <button type="submit" className="text-xs text-muted hover:text-danger">
                        {t("delete")}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <ExpenseDialog title={t("editExpense")} onClose={() => setEditing(null)}>
          <ExpenseForm
            key={editing.id}
            people={people}
            expense={editing}
            submitLabel={t("save")}
            onSaved={() => setEditing(null)}
          />
        </ExpenseDialog>
      ) : null}
    </>
  );
}
