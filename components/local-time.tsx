"use client";

import { useEffect, useState } from "react";
import { localeTag, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

export function LocalTime({
  iso,
  locale: localeProp,
}: {
  iso: string;
  locale?: Locale;
}) {
  const ctx = useLocale();
  const locale = localeProp ?? ctx;
  const [text, setText] = useState("");

  useEffect(() => {
    setText(
      new Intl.DateTimeFormat(localeTag(locale), {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso)),
    );
  }, [iso, locale]);

  return <time dateTime={iso}>{text}</time>;
}
