import { cookies } from "next/headers";

const COOKIE = "hmip_tz";

export function isTimeZone(value: string) {
  if (!/^[A-Za-z0-9_+\-\/]+$/.test(value) || value.length > 64) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export async function getTimeZone() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (value && isTimeZone(decodeURIComponent(value))) return decodeURIComponent(value);
  return "UTC";
}

export function startOfDayInTimeZone(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const num = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const year = num("year");
  const month = num("month");
  const day = num("day");
  const hour = num("hour");
  const minute = num("minute");
  const second = num("second");
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = asUtc - now.getTime();
  return new Date(Date.UTC(year, month - 1, day) - offset);
}

export async function startOfUserDay(now = new Date()) {
  return startOfDayInTimeZone(await getTimeZone(), now);
}
