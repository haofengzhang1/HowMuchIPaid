"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale, LOCALE_COOKIE } from "@/lib/locale";
import type { Locale } from "@/lib/i18n";

export async function toggleLocale() {
  const current = await getLocale();
  const next: Locale = current === "en" ? "zh" : "en";
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
