import { ExpenseTable } from "@/components/expense-table";
import { getActiveNotebook } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { getNotebook } from "@/lib/notebook";
import { personLabel } from "@/lib/participants";

export default async function ExpensesPage() {
  const user = await requireUser();
  const notebook = await getActiveNotebook(user);
  const { expenses, people } = await getNotebook(notebook.ownerId, user.id);
  const options = people.map((person) => ({
    id: person.id,
    name: personLabel(person, user.id),
  }));

  return (
    <main className="grid gap-4 sm:gap-5">
      <h1 className="text-xl font-semibold sm:text-2xl">Expenses</h1>
      {notebook.isShared ? (
        <p className="text-sm text-muted">Same list for everyone on this log.</p>
      ) : null}

      <section className="panel">
        <h2 className="panel-title">All entries</h2>
        <div className="mt-3">
          <ExpenseTable
            expenses={expenses}
            people={options}
            empty="No expenses yet. Tap + to add one."
          />
        </div>
      </section>
    </main>
  );
}
