"use client";

import { useActionState } from "react";
import { logIn, signUp, type ActionState } from "@/lib/actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? logIn : signUp;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Email</span>
        <input name="email" type="email" autoComplete="email" required className="field" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          className="field"
        />
      </label>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending
          ? mode === "login"
            ? "Logging in…"
            : "Creating account…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>
    </form>
  );
}
