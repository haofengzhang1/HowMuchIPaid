"use client";

import { useEffect, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { useLocale, useT } from "@/components/locale-provider";
import type { ChartBucket, PersonSeries } from "@/lib/stats";
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

export function PersonCurve({
  series,
  buckets,
  caption,
  toolbar,
}: {
  series: PersonSeries[];
  buckets: ChartBucket[];
  caption: string;
  toolbar?: ReactNode;
}) {
  const t = useT();
  const locale = useLocale();
  const [mode, setMode] = useState<"month" | "total">("total");
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState(Math.max(0, buckets.length - 1));
  const width = 640;
  const height = 280;
  const pad = { top: 16, right: 12, bottom: 36, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const lastKey = buckets[buckets.length - 1]?.key;

  useEffect(() => {
    setActive(Math.max(0, buckets.length - 1));
  }, [buckets.length, lastKey]);

  const lines = useMemo(
    () =>
      series.map((item, index) => {
        let running = 0;
        const values =
          mode === "total"
            ? item.monthly.map((value) => {
                running += value;
                return running;
              })
            : item.monthly;
        return {
          name: item.name,
          values,
          color: PALETTE[index % PALETTE.length],
        };
      }),
    [mode, series],
  );

  const visible = lines.filter((line) => !hidden.includes(line.name));
  const quote = visible.find((line) => line.name === "Total") ?? visible[0] ?? lines[0];
  const max = Math.max(...visible.flatMap((line) => line.values), 0);
  const chartMax = max === 0 ? 1 : max;
  const ticks = max === 0 ? [0] : [0, 0.5, 1];
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 8));
  const activeX =
    buckets.length <= 1
      ? pad.left + innerW / 2
      : pad.left + (active / (buckets.length - 1)) * innerW;
  const quoteValue = quote?.values[active] ?? 0;
  const openValue = mode === "total" ? (quote?.values[0] ?? 0) : (quote?.values[active - 1] ?? 0);
  const change = quoteValue - openValue;
  const changePct = openValue > 0 ? (change / openValue) * 100 : null;
  const up = change >= 0;
  const quoteY = pad.top + innerH * (1 - quoteValue / chartMax);

  function toggle(name: string) {
    setHidden((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function indexFromPointer(event: PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const t = buckets.length <= 1 ? 0 : (x - pad.left) / innerW;
    return Math.max(0, Math.min(buckets.length - 1, Math.round(t * (buckets.length - 1))));
  }

  return (
    <figure className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="panel-title">{t("spending")}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            className={`px-2.5 py-1 text-xs ${mode === "total" ? "bg-accent text-white" : "border border-line"}`}
            onClick={() => setMode("total")}
          >
            {t("cumulative")}
          </button>
          <button
            type="button"
            className={`px-2.5 py-1 text-xs ${mode === "month" ? "bg-accent text-white" : "border border-line"}`}
            onClick={() => setMode("month")}
          >
            {t("eachPeriod")}
          </button>
        </div>
      </div>
      {series.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("noExpenses")}</p>
      ) : (
        <>
          <div className="mt-3">
            <p className="text-3xl font-semibold tabular-nums leading-none sm:text-4xl">
              {formatMoney(quoteValue, "USD", locale)}
            </p>
            <p className={`mt-1.5 text-sm tabular-nums ${buckets.length > 1 ? (up ? "text-[#1a7f4b]" : "text-danger") : "text-muted"}`}>
              {buckets.length > 1 ? (
                <>
                  {up ? "+" : "−"}
                  {formatMoney(Math.abs(change), "USD", locale)}
                  {changePct === null ? "" : ` (${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%)`}
                  <span className="text-muted"> · {buckets[active]?.label}</span>
                </>
              ) : (
                buckets[active]?.label
              )}
            </p>
          </div>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-3 h-auto w-full max-w-full touch-none"
            role="img"
            aria-label={t("spendingChart")}
            onPointerMove={(event) => setActive(indexFromPointer(event))}
            onPointerDown={(event) => setActive(indexFromPointer(event))}
          >
            {ticks.map((tick) => {
              const y = pad.top + innerH * (1 - tick);
              const labelValue = chartMax * tick;
              return (
                <g key={tick}>
                  <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#ecece8" />
                  <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#5a5a5a">
                    {labelValue.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
                      maximumFractionDigits: labelValue > 0 && labelValue < 10 ? 1 : 0,
                    })}
                  </text>
                </g>
              );
            })}
            {buckets.map((bucket, index) => {
              if (index % labelEvery !== 0 && index !== buckets.length - 1) return null;
              const x =
                buckets.length === 1
                  ? pad.left + innerW / 2
                  : pad.left + (index / (buckets.length - 1)) * innerW;
              return (
                <text
                  key={bucket.key}
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill={index === active ? "#161616" : "#5a5a5a"}
                >
                  {bucket.label}
                </text>
              );
            })}
            {quote ? (
              <path
                d={areaPath(quote.values, chartMax, pad, innerW, innerH)}
                fill={up ? "#1a7f4b" : "#9b1c1c"}
                fillOpacity="0.12"
              />
            ) : null}
            <line
              x1={activeX}
              x2={activeX}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="#161616"
              strokeDasharray="3 3"
            />
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={quoteY}
              y2={quoteY}
              stroke="#161616"
              strokeDasharray="3 3"
              strokeOpacity="0.35"
            />
            {visible.map((line) => (
              <g key={line.name}>
                <path
                  d={curvePath(line.values, chartMax, pad, innerW, innerH)}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.name === "Total" ? 2.75 : 2}
                />
                <circle
                  cx={
                    buckets.length === 1
                      ? pad.left + innerW / 2
                      : pad.left + (active / (buckets.length - 1)) * innerW
                  }
                  cy={pad.top + innerH * (1 - (line.values[active] ?? 0) / chartMax)}
                  r="4"
                  fill="#ffffff"
                  stroke={line.color}
                  strokeWidth="2"
                />
              </g>
            ))}
            <rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="transparent" />
          </svg>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {lines.map((line) => {
              const off = hidden.includes(line.name);
              return (
                <li key={line.name}>
                  <button
                    type="button"
                    onClick={() => toggle(line.name)}
                    className={`flex min-h-9 items-center gap-2 border px-2 py-1 ${
                      off ? "border-line text-muted" : "border-ink"
                    }`}
                  >
                    <span
                      className="inline-block h-2 w-4"
                      style={{ background: off ? "#d2d2cc" : line.color }}
                    />
                    {line.name === "Total" ? t("total") : line.name}
                    <span className="tabular-nums text-muted">
                      {formatMoney(line.values[active] ?? 0, "USD", locale)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {toolbar ? <div className="mt-4 border-t border-line pt-2">{toolbar}</div> : null}
      <p className="mt-2 text-xs text-muted">{t("chartHint", { caption })}</p>
    </figure>
  );
}

function pointsFor(
  values: number[],
  chartMax: number,
  pad: { top: number; right: number; bottom: number; left: number },
  innerW: number,
  innerH: number,
) {
  return values.map((value, index) => {
    const x =
      values.length === 1 ? pad.left + innerW / 2 : pad.left + (index / (values.length - 1)) * innerW;
    const y = pad.top + innerH * (1 - value / chartMax);
    return { x, y };
  });
}

function curveFromPoints(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const mid = (from.x + to.x) / 2;
    path += ` C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`;
  }
  return path;
}

function curvePath(
  values: number[],
  chartMax: number,
  pad: { top: number; right: number; bottom: number; left: number },
  innerW: number,
  innerH: number,
) {
  return curveFromPoints(pointsFor(values, chartMax, pad, innerW, innerH));
}

function areaPath(
  values: number[],
  chartMax: number,
  pad: { top: number; right: number; bottom: number; left: number },
  innerW: number,
  innerH: number,
) {
  const points = pointsFor(values, chartMax, pad, innerW, innerH);
  if (points.length === 0) return "";
  const line = curveFromPoints(points);
  const baseline = pad.top + innerH;
  return `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
}
