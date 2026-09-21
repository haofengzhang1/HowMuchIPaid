import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";

const COOKIE = "hmip_locale";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export { COOKIE as LOCALE_COOKIE };
