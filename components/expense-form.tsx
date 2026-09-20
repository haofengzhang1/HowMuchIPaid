"use client";

import { useActionState, useEffect, useRef } from "react";
import { addExpense, type ActionState } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";
import { todayInputValue } from "@/lib/money";

type PersonOption = { id: string; name: string };

export function ExpenseForm({
  people,
  defaultPersonId,
  submitLabel = "Save expense",
  onSaved,
}: {
  people: PersonOption[];
  defaultPersonId?: string;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    addExpense,
    undefined,
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSaved?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSaved]);

  if (people.length === 0) {
    return (
      <p className="text-sm text-muted">
        Invite someone from People before adding an expense.
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Amount</span>
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          placeholder="0.00"
          autoFocus
          className="field"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Who</span>
        <select
          name="personId"
          required
          className="field"
          defaultValue={defaultPersonId ?? people[0]?.id ?? ""}
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Category</span>
        <select name="category" required className="field" defaultValue="Food">
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Date</span>
        <input
          name="spentAt"
          type="date"
          required
          defaultValue={todayInputValue()}
          className="field"
        />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        <span className="text-muted">Note</span>
        <input name="note" maxLength={500} placeholder="Optional" className="field" />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
      {state?.error ? (
        <p className="text-sm text-danger sm:col-span-2">{state.error}</p>
      ) : null}
    </form>
  );
}
