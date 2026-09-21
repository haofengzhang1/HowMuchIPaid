"use client";

import { useState } from "react";
import { useT } from "@/components/locale-provider";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  return (
    <button
      type="button"
      className="shrink-0 text-sm text-accent underline"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? t("copied") : t("copyLink")}
    </button>
  );
}
