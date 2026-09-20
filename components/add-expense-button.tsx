"use client";

import { useEffect, useId, useState } from "react";
import { ExpenseForm } from "@/components/expense-form";

type PersonOption = { id: string; name: string };

export function AddExpenseButton({
  people,
  defaultPersonId,
}: {
  people: PersonOption[];
  defaultPersonId?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center bg-accent text-3xl leading-none text-white shadow-sm bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6"
        aria-label="Add expense"
        onClick={() => setOpen(true)}
      >
        +
      </button>
      {open ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto border-t border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:border"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-lg font-semibold">
                New expense
              </h2>
              <button type="button" className="action-link text-muted" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ExpenseForm
              people={people}
              defaultPersonId={defaultPersonId}
              submitLabel="Add"
              onSaved={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
