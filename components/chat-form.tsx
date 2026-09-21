"use client";

import { useActionState, useEffect, useRef, type ClipboardEvent, type DragEvent } from "react";
import { useT } from "@/components/locale-provider";
import { sendChatMessage, type ChatState } from "@/lib/chat-actions";
import { DAILY_TEXT_LIMIT, MAX_TEXT_LENGTH } from "@/lib/chat-limits";

function blockNonText(event: ClipboardEvent | DragEvent) {
  const data = "clipboardData" in event ? event.clipboardData : event.dataTransfer;
  if (!data) return;
  const hasFile = [...data.items].some(
    (item) => item.kind === "file" || item.type.startsWith("image/") || item.type.startsWith("video/"),
  );
  if (hasFile) event.preventDefault();
}

export function ChatForm({
  recipientId,
  remaining,
}: {
  recipientId: string;
  remaining: number;
}) {
  const t = useT();
  const [state, action, pending] = useActionState<ChatState, FormData>(
    sendChatMessage,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  const disabled = remaining <= 0;

  return (
    <form ref={formRef} action={action} className="grid gap-2">
      <input type="hidden" name="recipientId" value={recipientId} />
      <label className="grid gap-1 text-sm">
        <span className="text-muted">{t("message")}</span>
        <textarea
          name="body"
          required
          maxLength={MAX_TEXT_LENGTH}
          rows={3}
          disabled={disabled}
          placeholder={disabled ? t("dailyLimit") : t("textOnlyPlaceholder")}
          className="field min-h-[4.5rem] resize-none"
          autoComplete="off"
          inputMode="text"
          onPaste={blockNonText}
          onDrop={blockNonText}
          onDragOver={(event) => event.preventDefault()}
        />
      </label>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {t("textsLeft", { remaining, limit: DAILY_TEXT_LIMIT })}
        </p>
        <button type="submit" disabled={pending || disabled} className="btn-primary px-4">
          {pending ? t("sending") : t("send")}
        </button>
      </div>
      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
