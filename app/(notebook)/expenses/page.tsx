import { ExpenseForm } from "@/components/expense-form";
import { ExpenseTable } from "@/components/expense-table";
import { requireUser } from "@/lib/auth";
import { getNotebook } from "@/lib/notebook";

export default async function ExpensesPage() {
  const user = await requireUser();
  const { people, expenses } = await getNotebook(user.id);

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Expenses</h1>
        <p className="mt-1 text-muted">Every amount this notebook is holding.</p>
      </div>

      <section className="panel">
        <h2 className="panel-title">Add an expense</h2>
        <div className="mt-4">
          <ExpenseForm people={people} />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">All entries</h2>
        <div className="mt-4">
          <ExpenseTable
            expenses={expenses}
            empty="No expenses yet. Log one above."
          />
        </div>
      </section>
    </main>
  );
}
