import Link from "next/link";
import { RANGES, type RangeKey } from "@/lib/stats";

export function RangeLinks({ current }: { current: RangeKey }) {
  return (
    <div className="flex gap-0 overflow-x-auto pr-16 sm:pr-0">
      {RANGES.map((range) => {
        const href = range.id === "1m" ? "/dashboard" : `/dashboard?range=${range.id}`;
        const active = range.id === current;
        return (
          <Link
            key={range.id}
            href={href}
            className={`shrink-0 px-2.5 py-1.5 text-xs font-medium ${
              active ? "bg-accent text-white" : "text-muted hover:text-ink"
            }`}
          >
            {range.label}
          </Link>
        );
      })}
    </div>
  );
}
