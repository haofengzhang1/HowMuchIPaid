import { ExpenseForm } from "@/components/expense-form";
import { ExpenseTable } from "@/components/expense-table";
import { requireUser } from "@/lib/auth";
import { getNotebook } from "@/lib/notebook";

export default async function ExpensesPage() {
  const user = await requireUser();
  const { people, expenses } = await getNotebook(user.id);

  return (
    <main className="grid gap-5">
      <h1 className="text-2xl font-semibold">Expenses</h1>

      <section className="panel">
        <h2 className="panel-title">Add</h2>
        <div className="mt-3">
          <ExpenseForm people={people} submitLabel="Add" />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">All entries</h2>
        <div className="mt-3">
          <ExpenseTable expenses={expenses} empty="No expenses yet." />
        </div>
      </section>
    </main>
  );
}
