import { deleteExpense } from "@/lib/actions";
import { formatDay, formatMoney } from "@/lib/money";
import type { ExpenseView } from "@/lib/stats";

export function ExpenseTable({
  expenses,
  empty,
}: {
  expenses: ExpenseView[];
  empty: string;
}) {
  if (expenses.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">Who</th>
            <th className="py-2 font-medium">Category</th>
            <th className="py-2 font-medium">Note</th>
            <th className="py-2 text-right font-medium">Amount</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b border-line/70">
              <td className="py-2">{formatDay(expense.spentAt)}</td>
              <td className="py-2">{expense.personName}</td>
              <td className="py-2">{expense.category}</td>
              <td className="max-w-48 truncate py-2 text-muted">{expense.note || "—"}</td>
              <td className="py-2 text-right tabular-nums">
                {formatMoney(expense.amount, expense.currency)}
              </td>
              <td className="py-2 text-right">
                <form action={deleteExpense}>
                  <input type="hidden" name="id" value={expense.id} />
                  <button type="submit" className="text-xs text-muted hover:text-danger">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
