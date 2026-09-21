"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ExpenseDialog } from "@/components/expense-dialog";
import { ExpenseForm } from "@/components/expense-form";
import { useT } from "@/components/locale-provider";

type PersonOption = { id: string; name: string };

export function AddExpenseButton({
  people,
  defaultPersonId,
}: {
  people: PersonOption[];
  defaultPersonId?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();
  if (pathname.startsWith("/chat") || pathname.startsWith("/account")) return null;

  return (
    <>
      <button
        type="button"
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center bg-accent text-3xl leading-none text-white shadow-sm bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6"
        aria-label={t("addExpense")}
        onClick={() => setOpen(true)}
      >
        +
      </button>
      {open ? (
        <ExpenseDialog title={t("newExpense")} onClose={() => setOpen(false)}>
          <ExpenseForm
            people={people}
            defaultPersonId={defaultPersonId}
            submitLabel={t("add")}
            onSaved={() => setOpen(false)}
          />
        </ExpenseDialog>
      ) : null}
    </>
  );
}
