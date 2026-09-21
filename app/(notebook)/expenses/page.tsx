import { ExpenseTable } from "@/components/expense-table";
import { getActiveNotebook } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { getNotebook } from "@/lib/notebook";
import { personLabel } from "@/lib/participants";

export default async function ExpensesPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const notebook = await getActiveNotebook(user);
  const { expenses, people } = await getNotebook(notebook.ownerId, user.id, locale);
  const options = people.map((person) => ({
    id: person.id,
    name: personLabel(person, user.id, {
      you: t(locale, "you"),
      invited: (email) => t(locale, "invitedSuffix", { email }),
    }),
  }));

  return (
    <main className="grid gap-4 sm:gap-5">
      <h1 className="text-xl font-semibold sm:text-2xl">{t(locale, "expenses")}</h1>
      {notebook.isShared ? (
        <p className="text-sm text-muted">{t(locale, "expensesShared")}</p>
      ) : null}

      <section className="panel">
        <h2 className="panel-title">{t(locale, "allEntries")}</h2>
        <div className="mt-3">
          <ExpenseTable
            expenses={expenses}
            people={options}
            empty={t(locale, "emptyExpenses")}
          />
        </div>
      </section>
    </main>
  );
}
