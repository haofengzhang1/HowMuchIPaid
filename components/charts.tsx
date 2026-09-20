"use client";

import { useState } from "react";
import type { NamedTotal } from "@/lib/stats";
import { formatMoney } from "@/lib/money";

const PALETTE = [
  "#123a73",
  "#9b1c1c",
  "#3d5a40",
  "#6b4f2a",
  "#444444",
  "#2c5282",
  "#7a3b2e",
  "#4a5568",
];

export function MonthlyChart({ data }: { data: NamedTotal[] }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 640;
  const height = 260;
  const pad = { top: 16, right: 12, bottom: 36, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 0);
  const chartMax = max === 0 ? 1 : max;
  const barW = innerW / data.length;
  const ticks = max === 0 ? [0] : [0, 0.5, 1];
  const selected = active === null ? null : data[active];

  return (
    <figure className="panel overflow-hidden">
      <h2 className="panel-title">Spending by month</h2>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-auto w-full max-w-full" role="img" aria-label="Spending by month">
        {ticks.map((tick) => {
          const y = pad.top + innerH * (1 - tick);
          const labelValue = chartMax * tick;
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#d2d2cc" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#5a5a5a">
                {labelValue.toLocaleString("en-US", {
                  maximumFractionDigits: labelValue > 0 && labelValue < 10 ? 1 : 0,
                })}
              </text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const h = (item.value / chartMax) * innerH;
          const x = pad.left + index * barW + barW * 0.18;
          const y = pad.top + innerH - h;
          const on = active === index;
          return (
            <g
              key={item.label}
              className="cursor-pointer"
              onPointerEnter={() => setActive(index)}
              onPointerDown={() => setActive(index)}
            >
              <rect
                x={pad.left + index * barW}
                y={pad.top}
                width={barW}
                height={innerH}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barW * 0.64}
                height={Math.max(h, item.value > 0 ? 2 : 0)}
                fill={on ? "#0d2c58" : "#123a73"}
              />
              <text
                x={x + barW * 0.32}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                fill={on ? "#161616" : "#5a5a5a"}
              >
                {item.label.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-sm">
        {selected
          ? `${selected.label}: ${formatMoney(selected.value)}`
          : "Tap a month for the amount."}
      </p>
    </figure>
  );
}

export function PersonBars({ data }: { data: NamedTotal[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className="panel">
      <h2 className="panel-title">Spending by person</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No expenses yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {data.map((item, index) => (
            <li key={item.label} className="grid gap-1">
              <div className="flex items-baseline justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-muted">{formatMoney(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden bg-line">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max((item.value / max) * 100, 2)}%`,
                    background: PALETTE[index % PALETTE.length],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

export function CategoryPie({ data, caption }: { data: NamedTotal[]; caption?: string }) {
  const [active, setActive] = useState(0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const cx = 110;
  const cy = 110;
  const r = 90;
  let angle = 0;

  const slices = data.map((item, index) => {
    const sweep = total === 0 ? 0 : (item.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...item, start, end, color: PALETTE[index % PALETTE.length] };
  });
  const selected = slices[active] ?? slices[0];
  const percent =
    selected && total > 0 ? Math.round((selected.value / total) * 100) : 0;

  return (
    <figure className="panel">
      <h2 className="panel-title">Spending by category{caption ? ` · ${caption}` : ""}</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No expenses yet.</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <svg viewBox="0 0 220 220" className="h-40 w-40 shrink-0 sm:h-48 sm:w-48" role="img" aria-label="Spending by category">
            {slices.length === 1 ? (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={slices[0].color}
                className="cursor-pointer"
                onPointerDown={() => setActive(0)}
              />
            ) : (
              slices.map((slice, index) => (
                <path
                  key={slice.label}
                  d={describeSlice(cx, cy, r, slice.start, slice.end)}
                  fill={slice.color}
                  opacity={index === active ? 1 : 0.45}
                  className="cursor-pointer"
                  onPointerEnter={() => setActive(index)}
                  onPointerDown={() => setActive(index)}
                />
              ))
            )}
            <circle cx={cx} cy={cy} r={48} fill="#ffffff" />
            {selected ? (
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill="#161616">
                {percent}%
              </text>
            ) : null}
            {selected ? (
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#5a5a5a">
                {selected.label}
              </text>
            ) : null}
          </svg>
          <ul className="grid w-full gap-1 text-sm">
            {slices.map((slice, index) => (
              <li key={slice.label}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  className={`flex w-full min-h-9 items-center justify-between gap-3 px-1 ${
                    index === active ? "bg-bg" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5"
                      style={{ background: slice.color }}
                    />
                    {slice.label}
                  </span>
                  <span className="text-muted">{formatMoney(slice.value)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  );
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx: number, cy: number, r: number, start: number, end: number) {
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y} Z`;
}
