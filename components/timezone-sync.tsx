"use client";

import { useEffect } from "react";

export function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const current = document.cookie
      .split("; ")
      .find((part) => part.startsWith("hmip_tz="))
      ?.slice("hmip_tz=".length);
    if (current === encodeURIComponent(tz)) return;
    document.cookie = `hmip_tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return null;
}
