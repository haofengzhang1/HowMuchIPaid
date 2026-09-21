"use client";

import { toggleLocale } from "@/lib/locale-actions";
import { useLocale, useT } from "@/components/locale-provider";

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useT();

  return (
    <form action={toggleLocale}>
      <button
        type="submit"
        className={`min-h-9 px-2.5 text-sm text-accent ${className}`}
      >
        {locale === "en" ? t("switchToZh") : t("switchToEn")}
      </button>
    </form>
  );
}
