import { PersonForm } from "@/components/person-form";
import { deletePerson } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getNotebook } from "@/lib/notebook";
import { buildStats } from "@/lib/stats";

export default async function PeoplePage() {
  const user = await requireUser();
  const { people, expenses } = await getNotebook(user.id);
  const stats = buildStats(expenses);
  const totals = new Map(stats.byPerson.map((item) => [item.label, item.value]));

  return (
    <main className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">People</h1>
        <p className="mt-1 text-muted">
          Track your own spending, then add anyone else you want to remember.
        </p>
      </div>

      <section className="panel">
        <h2 className="panel-title">Add a person</h2>
        <div className="mt-4">
          <PersonForm />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">In this notebook</h2>
        <ul className="mt-4 divide-y divide-line">
          {people.map((person) => {
            const canDelete = people.length > 1 && person._count.expenses === 0;
            return (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted">
                    {person._count.expenses}{" "}
                    {person._count.expenses === 1 ? "expense" : "expenses"} ·{" "}
                    {formatMoney(totals.get(person.name) ?? 0)}
                  </p>
                </div>
                {canDelete ? (
                  <form action={deletePerson}>
                    <input type="hidden" name="id" value={person.id} />
                    <button type="submit" className="text-sm text-muted hover:text-danger">
                      Remove
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-muted">
                    {person._count.expenses > 0
                      ? "Remove their expenses first"
                      : "Keep at least one person"}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
