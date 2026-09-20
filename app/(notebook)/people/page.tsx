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
    <main className="grid gap-5">
      <h1 className="text-2xl font-semibold">People</h1>
      <p className="text-sm text-muted">You, plus anyone else you want to track.</p>

      <section className="panel">
        <h2 className="panel-title">Add person</h2>
        <div className="mt-3">
          <PersonForm />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">List</h2>
        <ul className="mt-2 divide-y divide-line">
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
                      ? "Delete their expenses first"
                      : "Need at least one person"}
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
