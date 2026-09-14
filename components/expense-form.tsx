"use client";

import { useActionState } from "react";
import { addExpense, type ActionState } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";
import { todayInputValue } from "@/lib/money";

type PersonOption = { id: string; name: string };

export function ExpenseForm({
  people,
  submitLabel = "Save expense",
}: {
  people: PersonOption[];
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    addExpense,
    undefined,
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Amount</span>
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="0.00"
          className="field"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Who</span>
        <select name="personId" required className="field" defaultValue={people[0]?.id ?? ""}>
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
      <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
        <span className="text-muted">Note</span>
        <input name="note" maxLength={500} placeholder="Optional" className="field" />
      </label>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
      {state?.error ? (
        <p className="text-sm text-danger sm:col-span-2 lg:col-span-6">{state.error}</p>
      ) : null}
    </form>
  );
}
