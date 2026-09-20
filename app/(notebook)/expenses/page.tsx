import { ExpenseTable } from "@/components/expense-table";
import { getActiveNotebook } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { getNotebook } from "@/lib/notebook";

export default async function ExpensesPage() {
  const user = await requireUser();
  const notebook = await getActiveNotebook(user);
  const { expenses } = await getNotebook(notebook.ownerId, user.id);

  return (
    <main className="grid gap-4 sm:gap-5">
      <h1 className="text-xl font-semibold sm:text-2xl">Expenses</h1>
      {!notebook.isOwn ? (
        <p className="text-sm text-muted">Editing {notebook.email}</p>
      ) : null}

      <section className="panel">
        <h2 className="panel-title">All entries</h2>
        <div className="mt-3">
          <ExpenseTable expenses={expenses} empty="No expenses yet. Tap + to add one." />
        </div>
      </section>
    </main>
  );
}
