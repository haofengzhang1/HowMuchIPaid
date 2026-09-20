import { PersonCurve } from "@/components/person-curve";
import { PersonForm } from "@/components/person-form";
import { getActiveNotebook } from "@/lib/access";
import { deletePerson } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getNotebook } from "@/lib/notebook";
import { buildPersonSeries, buildStats, chartBuckets } from "@/lib/stats";

export default async function PeoplePage() {
  const user = await requireUser();
  const notebook = await getActiveNotebook(user);
  const { people, expenses } = await getNotebook(notebook.ownerId);
  const stats = buildStats(expenses);
  const thisMonth = buildStats(
    expenses.filter((expense) => {
      const spent = new Date(expense.spentAt);
      const now = new Date();
      return spent.getFullYear() === now.getFullYear() && spent.getMonth() === now.getMonth();
    }),
  );
  const totals = new Map(stats.byPerson.map((item) => [item.label, item.value]));
  const monthTotals = new Map(thisMonth.byPerson.map((item) => [item.label, item.value]));
  const firstSpend = expenses.reduce<Date | undefined>((earliest, expense) => {
    const spent = new Date(expense.spentAt);
    if (!earliest || spent < earliest) return spent;
    return earliest;
  }, undefined);
  const buckets = chartBuckets("all", new Date(), firstSpend);
  const personSeries = buildPersonSeries(expenses, buckets);

  return (
    <main className="grid gap-4 sm:gap-5">
      <h1 className="text-xl font-semibold sm:text-2xl">People</h1>
      <p className="text-sm text-muted">
        {notebook.isOwn
          ? "You, plus anyone else you want to track."
          : `People on ${notebook.email}'s log.`}
      </p>

      <PersonCurve
        series={personSeries}
        buckets={buckets}
        caption="All time"
      />

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
            const total = totals.get(person.name) ?? 0;
            const share = stats.allTime > 0 ? Math.round((total / stats.allTime) * 100) : 0;
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
                    {formatMoney(total)} all time · {share}% · this month{" "}
                    {formatMoney(monthTotals.get(person.name) ?? 0)}
                  </p>
                </div>
                {canDelete ? (
                  <form action={deletePerson}>
                    <input type="hidden" name="id" value={person.id} />
                    <button type="submit" className="action-link text-muted hover:text-danger">
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
