import { CategoryPie, MonthlyChart, PersonBars } from "@/components/charts";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseTable } from "@/components/expense-table";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getNotebook } from "@/lib/notebook";
import { buildStats } from "@/lib/stats";

export default async function DashboardPage() {
  const user = await requireUser();
  const { people, expenses } = await getNotebook(user.id);
  const stats = buildStats(expenses);
  const recent = expenses.slice(0, 8);

  return (
    <main className="grid gap-5">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <section className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="All time" value={formatMoney(stats.allTime)} />
        <Stat label="This month" value={formatMoney(stats.thisMonth)} />
        <Stat label="Entries" value={String(stats.count)} />
        <Stat label="People" value={String(people.length)} />
      </section>

      <section className="panel">
        <h2 className="panel-title">New entry</h2>
        <div className="mt-3">
          <ExpenseForm people={people} submitLabel="Add" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MonthlyChart data={stats.months} />
        </div>
        <PersonBars data={stats.byPerson} />
        <CategoryPie data={stats.byCategory} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Recent</h2>
        <div className="mt-3">
          <ExpenseTable expenses={recent} empty="No expenses yet." />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
