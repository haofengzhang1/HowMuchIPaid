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
    <main className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted">What this notebook remembers so far.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="All time" value={formatMoney(stats.allTime)} />
        <Stat label="This month" value={formatMoney(stats.thisMonth)} />
        <Stat label="Entries" value={String(stats.count)} />
        <Stat label="People" value={String(people.length)} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Log a spend</h2>
        <div className="mt-4">
          <ExpenseForm people={people} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MonthlyChart data={stats.months} />
        </div>
        <PersonBars data={stats.byPerson} />
        <CategoryPie data={stats.byCategory} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Recent expenses</h2>
        <div className="mt-4">
          <ExpenseTable
            expenses={recent}
            empty="Nothing logged yet. Add the first amount above."
          />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-serif text-2xl tracking-tight">{value}</p>
    </div>
  );
}
