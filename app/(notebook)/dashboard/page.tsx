import { CategoryPie } from "@/components/charts";
import { PersonCurve } from "@/components/person-curve";
import { RangeLinks } from "@/components/range-links";
import { getActiveNotebook } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { t, rangeMessage } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { getNotebook } from "@/lib/notebook";
import { prisma } from "@/lib/prisma";
import { acceptInvite, declineInvite } from "@/lib/share-actions";
import {
  buildPersonSeries,
  buildStats,
  chartBuckets,
  parseRange,
  priorWindow,
} from "@/lib/stats";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser();
  const locale = await getLocale();
  const notebook = await getActiveNotebook(user);
  const { expenses } = await getNotebook(notebook.ownerId, user.id, locale);
  const { range: rangeRaw } = await searchParams;
  const range = parseRange(rangeRaw);
  const lifetime = buildStats(expenses, locale);
  const firstSpend = earliestSpend(expenses);
  const buckets = chartBuckets(range, new Date(), firstSpend, locale);
  const windowStart = buckets[0]?.start;
  const windowEnd = buckets[buckets.length - 1]?.end;
  const inWindow = expenses.filter((expense) => inBucketWindow(expense.spentAt, windowStart, windowEnd));
  const stats = buildStats(inWindow, locale);
  const personSeries = buildPersonSeries(inWindow, buckets);
  const previous = priorWindow(buckets);
  const priorTotal = previous
    ? expenses
        .filter((expense) => inBucketWindow(expense.spentAt, previous.start, previous.end))
        .reduce((sum, expense) => sum + expense.amount, 0)
    : 0;
  const vsPrior = stats.allTime - priorTotal;
  const vsPriorPct = priorTotal > 0 ? (vsPrior / priorTotal) * 100 : null;
  const caption = t(locale, rangeMessage[range].caption);
  const vsPriorHint = previous
    ? t(locale, "vsPrior", {
        amount: `${vsPrior >= 0 ? "+" : "−"}${formatMoney(Math.abs(vsPrior), "USD", locale)}${
          vsPriorPct === null ? "" : ` (${vsPriorPct >= 0 ? "+" : ""}${vsPriorPct.toFixed(0)}%)`
        }`,
      })
    : undefined;
  const pendingInvites = await prisma.invite.findMany({
    where: { email: user.email, status: "pending" },
    include: { owner: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="grid gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{t(locale, "overview")}</h1>
        {notebook.isShared ? (
          <p className="mt-1 text-sm text-muted">
            {t(locale, "sharedWith", {
              names: notebook.isOwn ? notebook.sharedWith.join(", ") : notebook.email,
            })}
          </p>
        ) : null}
      </div>

      {pendingInvites.length > 0 ? (
        <section className="panel">
          <h2 className="panel-title">{t(locale, "invites")}</h2>
          <ul className="mt-3 divide-y divide-line">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="break-all text-sm">{t(locale, "invitedYou", { email: invite.owner.email })}</p>
                <div className="flex min-h-10 items-center gap-4">
                  <form action={acceptInvite}>
                    <input type="hidden" name="token" value={invite.token} />
                    <button type="submit" className="action-link text-accent">
                      {t(locale, "accept")}
                    </button>
                  </form>
                  <form action={declineInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <button type="submit" className="action-link text-muted hover:text-danger">
                      {t(locale, "decline")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-px border border-line bg-line">
        <Stat
          label={caption}
          value={formatMoney(stats.allTime, "USD", locale)}
          hint={vsPriorHint}
          up={vsPrior >= 0}
        />
        <Stat label={t(locale, "allTime")} value={formatMoney(lifetime.allTime, "USD", locale)} />
      </section>

      <PersonCurve
        key={range}
        series={personSeries}
        buckets={buckets}
        caption={caption}
        toolbar={<RangeLinks current={range} />}
      />
      <CategoryPie data={stats.byCategory} caption={caption} />
    </main>
  );
}

function earliestSpend(expenses: { spentAt: string }[]) {
  return expenses.reduce<Date | undefined>((earliest, expense) => {
    const spent = new Date(expense.spentAt);
    if (!earliest || spent < earliest) return spent;
    return earliest;
  }, undefined);
}

function inBucketWindow(spentAt: string, start?: Date, end?: Date) {
  if (!start || !end) return true;
  const spent = new Date(spentAt);
  return spent >= start && spent < end;
}

function Stat({
  label,
  value,
  hint,
  up,
}: {
  label: string;
  value: string;
  hint?: string;
  up?: boolean;
}) {
  return (
    <div className="bg-surface px-3 py-3 sm:px-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{value}</p>
      {hint ? (
        <p className={`mt-1 text-xs tabular-nums ${up ? "text-[#1a7f4b]" : "text-danger"}`}>{hint}</p>
      ) : null}
    </div>
  );
}
