"use client";

import { useActionState } from "react";
import { useT } from "@/components/locale-provider";
import { createInvite, type ShareState } from "@/lib/share-actions";
import { CopyButton } from "@/components/copy-button";

export function InviteForm() {
  const t = useT();
  const [state, action, pending] = useActionState<ShareState, FormData>(
    createInvite,
    undefined,
  );

  return (
    <div className="grid gap-3">
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid min-w-0 flex-1 gap-1 text-sm">
          <span className="text-muted">{t("email")}</span>
          <input name="email" type="email" required className="field" />
        </label>
        <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
          {pending ? t("creating") : t("sendInvite")}
        </button>
      </form>
      {state && "error" in state ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state && "url" in state ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="min-w-0 break-all text-muted">{state.url}</span>
          <CopyButton value={state.url} />
        </p>
      ) : null}
    </div>
  );
}
