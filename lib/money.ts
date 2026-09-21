import { localeTag, type Locale } from "@/lib/i18n";

export function formatMoney(amount: number, currency = "USD", locale: Locale = "en") {
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function dateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayInputValue() {
  return dateInputValue(new Date());
}

export function isoToDateInput(iso: string) {
  return dateInputValue(new Date(iso));
}

export function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(key: string, locale: Locale = "en") {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(localeTag(locale), {
    month: "short",
    year: "numeric",
  });
}

export function formatDay(iso: string, locale: Locale = "en") {
  return new Date(iso).toLocaleDateString(localeTag(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
