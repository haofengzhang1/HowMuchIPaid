"use client";

import { useActionState } from "react";
import { addPerson, type ActionState } from "@/lib/actions";

export function PersonForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    addPerson,
    undefined,
  );

  return (
    <form action={action} className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid min-w-0 flex-1 gap-1 text-sm">
          <span className="text-muted">Name</span>
          <input name="name" required maxLength={80} placeholder="Alex" className="field" />
        </label>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Adding…" : "Add person"}
        </button>
      </div>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
