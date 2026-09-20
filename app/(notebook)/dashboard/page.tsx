import { CategoryPie } from "@/components/charts";
import { PersonCurve } from "@/components/person-curve";
import { RangeLinks } from "@/components/range-links";
import { getActiveNotebook } from "@/lib/access";
import { requireUser } from "@/lib/auth";
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
  rangeCaption,
} from "@/lib/stats";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser();
  const notebook = await getActiveNotebook(user);
  const { expenses } = await getNotebook(notebook.ownerId);
  const { range: rangeRaw } = await searchParams;
  const range = parseRange(rangeRaw);
  const lifetime = buildStats(expenses);
  const firstSpend = earliestSpend(expenses);
  const buckets = chartBuckets(range, new Date(), firstSpend);
  const windowStart = buckets[0]?.start;
  const windowEnd = buckets[buckets.length - 1]?.end;
  const inWindow = expenses.filter((expense) => inBucketWindow(expense.spentAt, windowStart, windowEnd));
  const stats = buildStats(inWindow);
  const personSeries = buildPersonSeries(inWindow, buckets);
  const previous = priorWindow(buckets);
  const priorTotal = previous
    ? expenses
        .filter((expense) => inBucketWindow(expense.spentAt, previous.start, previous.end))
        .reduce((sum, expense) => sum + expense.amount, 0)
    : 0;
  const vsPrior = stats.allTime - priorTotal;
  const vsPriorPct = priorTotal > 0 ? (vsPrior / priorTotal) * 100 : null;
  const pendingInvites = await prisma.invite.findMany({
    where: { email: user.email, status: "pending" },
    include: { owner: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="grid gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Overview</h1>
        {!notebook.isOwn ? (
          <p className="mt-1 text-sm text-muted">Editing {notebook.email}</p>
        ) : null}
      </div>

      {pendingInvites.length > 0 ? (
        <section className="panel">
          <h2 className="panel-title">Invites</h2>
          <ul className="mt-3 divide-y divide-line">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="break-all text-sm">{invite.owner.email} invited you.</p>
                <div className="flex min-h-10 items-center gap-4">
                  <form action={acceptInvite}>
                    <input type="hidden" name="token" value={invite.token} />
                    <button type="submit" className="action-link text-accent">
                      Accept
                    </button>
                  </form>
                  <form action={declineInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <button type="submit" className="action-link text-muted hover:text-danger">
                      Decline
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
          label={rangeCaption(range)}
          value={formatMoney(stats.allTime)}
          hint={
            previous
              ? `${vsPrior >= 0 ? "+" : "−"}${formatMoney(Math.abs(vsPrior))}${
                  vsPriorPct === null ? "" : ` (${vsPriorPct >= 0 ? "+" : ""}${vsPriorPct.toFixed(0)}%)`
                } vs prior`
              : undefined
          }
          up={vsPrior >= 0}
        />
        <Stat label="All time" value={formatMoney(lifetime.allTime)} />
      </section>

      <PersonCurve
        key={range}
        series={personSeries}
        buckets={buckets}
        caption={rangeCaption(range)}
        toolbar={<RangeLinks current={range} />}
      />
      <CategoryPie data={stats.byCategory} caption={rangeCaption(range)} />
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
