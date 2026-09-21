import Link from "next/link";
import { InviteForm } from "@/components/invite-form";
import { PersonCurve } from "@/components/person-curve";
import { getActiveNotebook } from "@/lib/access";
import { deletePerson } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { getNotebook } from "@/lib/notebook";
import { personLabel } from "@/lib/participants";
import { buildPersonSeries, buildStats, chartBuckets } from "@/lib/stats";

export default async function PeoplePage() {
  const user = await requireUser();
  const locale = await getLocale();
  const notebook = await getActiveNotebook(user);
  const labels = {
    you: t(locale, "you"),
    invited: (email: string) => t(locale, "invitedSuffix", { email }),
  };
  const { people, expenses } = await getNotebook(notebook.ownerId, user.id, locale);
  const stats = buildStats(expenses, locale);
  const thisMonth = buildStats(
    expenses.filter((expense) => {
      const spent = new Date(expense.spentAt);
      const now = new Date();
      return spent.getFullYear() === now.getFullYear() && spent.getMonth() === now.getMonth();
    }),
    locale,
  );
  const totals = new Map(stats.byPerson.map((item) => [item.label, item.value]));
  const monthTotals = new Map(thisMonth.byPerson.map((item) => [item.label, item.value]));
  const firstSpend = expenses.reduce<Date | undefined>((earliest, expense) => {
    const spent = new Date(expense.spentAt);
    if (!earliest || spent < earliest) return spent;
    return earliest;
  }, undefined);
  const buckets = chartBuckets("all", new Date(), firstSpend, locale);
  const personSeries = buildPersonSeries(expenses, buckets);
  const expenseCounts = new Map<string, number>();
  for (const expense of expenses) {
    expenseCounts.set(expense.personName, (expenseCounts.get(expense.personName) ?? 0) + 1);
  }

  return (
    <main className="grid gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{t(locale, "people")}</h1>
        <p className="mt-1 text-sm text-muted">{t(locale, "peopleBlurb")}</p>
      </div>

      <PersonCurve series={personSeries} buckets={buckets} caption={t(locale, "allTime")} />

      {notebook.isOwn ? (
        <section className="panel">
          <h2 className="panel-title">{t(locale, "invite")}</h2>
          <div className="mt-3">
            <InviteForm />
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="panel-title">{t(locale, "onThisLog")}</h2>
        <ul className="mt-2 divide-y divide-line">
          {people.map((person) => {
            const label = personLabel(person, user.id, labels);
            const isOwner = person.userId === notebook.ownerId;
            const leftover = !person.userId && !person.name.includes("@");
            const count = expenseCounts.get(label) ?? expenseCounts.get(person.name) ?? 0;
            const canRemove = leftover && count === 0;
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
                    {isOwner ? `${t(locale, "owner")} · ` : null}
                    {t(locale, "peopleStat", {
                      count: count === 1 ? t(locale, "expenseCountOne") : t(locale, "expenseCount", { count }),
                      total: formatMoney(total, "USD", locale),
                      share,
                      month: formatMoney(monthTotals.get(label) ?? monthTotals.get(person.name) ?? 0, "USD", locale),
                    })}
                  </p>
                </div>
                {canRemove ? (
                  <form action={deletePerson}>
                    <input type="hidden" name="id" value={person.id} />
                    <button type="submit" className="action-link text-muted hover:text-danger">
                      {t(locale, "remove")}
                    </button>
                  </form>
                ) : leftover && count > 0 ? (
                  <p className="text-xs text-muted">{t(locale, "oldName")}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
        {notebook.isOwn ? (
          <p className="mt-3 text-xs text-muted">
            {t(locale, "revokeHint")}{" "}
            <Link href="/sharing" className="text-accent underline">
              {t(locale, "sharing")}
            </Link>
          </p>
        ) : null}
      </section>
    </main>
  );
}
