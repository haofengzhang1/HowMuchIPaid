import Link from "next/link";
import { InviteForm } from "@/components/invite-form";
import { PersonCurve } from "@/components/person-curve";
import { getActiveNotebook } from "@/lib/access";
import { deletePerson } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getNotebook } from "@/lib/notebook";
import { personLabel } from "@/lib/participants";
import { buildPersonSeries, buildStats, chartBuckets } from "@/lib/stats";

export default async function PeoplePage() {
  const user = await requireUser();
  const notebook = await getActiveNotebook(user);
  const { people, expenses } = await getNotebook(notebook.ownerId, user.id);
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
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">People</h1>
        <p className="mt-1 text-sm text-muted">
          {notebook.isOwn
            ? "Invite an account to add them under Who. After they accept, they can see and edit this log."
            : `People on ${notebook.email}'s log. Both of you can add and change expenses here.`}
        </p>
      </div>

      <PersonCurve series={personSeries} buckets={buckets} caption="All time" />

      {notebook.isOwn ? (
        <section className="panel">
          <h2 className="panel-title">Invite</h2>
          <div className="mt-3">
            <InviteForm />
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="panel-title">On this log</h2>
        <ul className="mt-2 divide-y divide-line">
          {people.map((person) => {
            const label = personLabel(person, user.id);
            const isOwner = person.userId === notebook.ownerId;
            const leftover = !person.userId && !person.name.includes("@");
            const canRemove = leftover && person._count.expenses === 0;
            const total = totals.get(label) ?? totals.get(person.name) ?? 0;
            const share = stats.allTime > 0 ? Math.round((total / stats.allTime) * 100) : 0;
            return (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium break-all">{label}</p>
                  <p className="text-sm text-muted">
                    {isOwner ? "Owner · " : null}
                    {person._count.expenses}{" "}
                    {person._count.expenses === 1 ? "expense" : "expenses"} ·{" "}
                    {formatMoney(total)} all time · {share}% · this month{" "}
                    {formatMoney(monthTotals.get(label) ?? monthTotals.get(person.name) ?? 0)}
                  </p>
                </div>
                {canRemove ? (
                  <form action={deletePerson}>
                    <input type="hidden" name="id" value={person.id} />
                    <button type="submit" className="action-link text-muted hover:text-danger">
                      Remove
                    </button>
                  </form>
                ) : leftover && person._count.expenses > 0 ? (
                  <p className="text-xs text-muted">Old name, not an account</p>
                ) : null}
              </li>
            );
          })}
        </ul>
        {notebook.isOwn ? (
          <p className="mt-3 text-xs text-muted">
            To revoke access, use{" "}
            <Link href="/sharing" className="text-accent underline">
              Sharing
            </Link>
            .
          </p>
        ) : null}
      </section>
    </main>
  );
}
