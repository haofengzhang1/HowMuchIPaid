import { localeTag, type Locale } from "@/lib/i18n";
import { formatMonthKey, monthKey } from "@/lib/money";

export type ExpenseView = {
  id: string;
  amount: number;
  currency: string;
  category: string;
  note: string;
  spentAt: string;
  personId: string;
  personName: string;
};

export type NamedTotal = {
  label: string;
  value: number;
};

export type RangeKey = "1w" | "1m" | "3m" | "6m" | "ytd" | "1y" | "all";

export const RANGES: { id: RangeKey; label: string; caption: string }[] = [
  { id: "1w", label: "1W", caption: "Last 7 days" },
  { id: "1m", label: "1M", caption: "Last 30 days" },
  { id: "3m", label: "3M", caption: "Last 3 months" },
  { id: "6m", label: "6M", caption: "Last 6 months" },
  { id: "ytd", label: "YTD", caption: "Year to date" },
  { id: "1y", label: "1Y", caption: "Last 12 months" },
  { id: "all", label: "ALL", caption: "All time" },
];

export type ChartBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

export type PersonSeries = {
  name: string;
  monthly: number[];
};

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseRange(value: string | undefined): RangeKey {
  if (value === "1w" || value === "1m" || value === "3m" || value === "6m" || value === "ytd" || value === "1y" || value === "all") {
    return value;
  }
  if (value === "month") return "1m";
  if (value === "year") return "1y";
  return "1m";
}

export function rangeCaption(range: RangeKey) {
  return RANGES.find((item) => item.id === range)?.caption ?? "Last 30 days";
}

function dailyBuckets(days: number, now: Date, locale: Locale): ChartBucket[] {
  const today = startOfDay(now);
  return Array.from({ length: days }, (_, index) => {
    const start = addDays(today, index - (days - 1));
    return {
      key: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`,
      label:
        days <= 7
          ? start.toLocaleDateString(localeTag(locale), { weekday: "short" })
          : `${start.getMonth() + 1}/${start.getDate()}`,
      start,
      end: addDays(start, 1),
    };
  });
}

function weeklyBuckets(weeks: number, now: Date): ChartBucket[] {
  const end = addDays(startOfDay(now), 1);
  const start = addDays(end, -weeks * 7);
  return Array.from({ length: weeks }, (_, week) => {
    const bucketStart = addDays(start, week * 7);
    return {
      key: `w${week}`,
      label: `${bucketStart.getMonth() + 1}/${bucketStart.getDate()}`,
      start: bucketStart,
      end: addDays(bucketStart, 7),
    };
  });
}

function monthlyBuckets(count: number, now: Date, locale: Locale, fromYearStart = false): ChartBucket[] {
  const startMonth = fromYearStart ? 0 : now.getMonth() - (count - 1);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), startMonth + index, 1);
    return {
      key: monthKey(date),
      label: date.toLocaleDateString(localeTag(locale), { month: "short" }),
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
    };
  });
}

function yearlyBuckets(startYear: number, now: Date): ChartBucket[] {
  const count = Math.max(1, now.getFullYear() - startYear + 1);
  return Array.from({ length: count }, (_, index) => {
    const year = startYear + index;
    return {
      key: String(year),
      label: String(year),
      start: new Date(year, 0, 1),
      end: new Date(year + 1, 0, 1),
    };
  });
}

export function chartBuckets(
  range: RangeKey,
  now = new Date(),
  firstSpend?: Date,
  locale: Locale = "en",
): ChartBucket[] {
  if (range === "1w") return dailyBuckets(7, now, locale);
  if (range === "1m") return dailyBuckets(30, now, locale);
  if (range === "3m") return weeklyBuckets(13, now);
  if (range === "6m") return weeklyBuckets(26, now);
  if (range === "1y") return monthlyBuckets(12, now, locale);
  if (range === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.round((startOfDay(now).getTime() - start.getTime()) / 86_400_000) + 1;
    if (days <= 31) return dailyBuckets(days, now, locale);
    if (days <= 120) return weeklyBuckets(Math.max(1, Math.ceil(days / 7)), now);
    return monthlyBuckets(now.getMonth() + 1, now, locale, true);
  }

  const start = firstSpend
    ? new Date(firstSpend.getFullYear(), firstSpend.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1;
  if (months > 36) return yearlyBuckets(start.getFullYear(), now);
  return monthlyBuckets(Math.max(1, months), now, locale);
}

export function priorWindow(buckets: ChartBucket[]) {
  if (buckets.length === 0) return null;
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;
  const span = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - span), end: start };
}

export function buildPersonSeries(expenses: ExpenseView[], buckets: ChartBucket[]): PersonSeries[] {
  const names = [...new Set(expenses.map((expense) => expense.personName))];
  const people = names
    .map((name) => {
      const monthly = buckets.map((bucket) =>
        expenses
          .filter((expense) => {
            if (expense.personName !== name) return false;
            const spent = new Date(expense.spentAt);
            return spent >= bucket.start && spent < bucket.end;
          })
          .reduce((sum, expense) => sum + expense.amount, 0),
      );
      return { name, monthly };
    })
    .filter((series) => series.monthly.some((value) => value > 0))
    .sort((a, b) => b.monthly.reduce((sum, value) => sum + value, 0) - a.monthly.reduce((sum, value) => sum + value, 0));

  if (people.length <= 1) return people;

  const total = {
    name: "Total",
    monthly: buckets.map((_, index) => people.reduce((sum, series) => sum + series.monthly[index], 0)),
  };
  return [total, ...people];
}

export function buildStats(expenses: ExpenseView[], locale: Locale = "en") {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);

  const allTime = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonth = expenses
    .filter((expense) => new Date(expense.spentAt) >= thisMonthStart)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const byPersonMap = new Map<string, number>();
  const byCategoryMap = new Map<string, number>();
  const byMonthMap = new Map<string, number>();

  for (const expense of expenses) {
    byPersonMap.set(
      expense.personName,
      (byPersonMap.get(expense.personName) ?? 0) + expense.amount,
    );
    byCategoryMap.set(
      expense.category,
      (byCategoryMap.get(expense.category) ?? 0) + expense.amount,
    );
    const key = monthKey(new Date(expense.spentAt));
    byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + expense.amount);
  }

  const months: NamedTotal[] = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    months.push({
      label: formatMonthKey(key, locale),
      value: byMonthMap.get(key) ?? 0,
    });
  }

  const byPerson: NamedTotal[] = [...byPersonMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const byCategory: NamedTotal[] = [...byCategoryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const biggest = expenses.reduce<ExpenseView | null>((current, expense) => {
    if (!current || expense.amount > current.amount) return expense;
    return current;
  }, null);

  return {
    allTime,
    thisMonth,
    count: expenses.length,
    byPerson,
    byCategory,
    months,
    biggest,
  };
}
