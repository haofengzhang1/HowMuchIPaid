import type { NamedTotal } from "@/lib/stats";
import { formatMoney } from "@/lib/money";

const PALETTE = [
  "#3f5c4a",
  "#8b3a2a",
  "#2c4a6e",
  "#a65d3a",
  "#6b5344",
  "#4f6b5c",
  "#7a5c2e",
  "#4a4a4a",
];

export function MonthlyChart({ data }: { data: NamedTotal[] }) {
  const width = 640;
  const height = 260;
  const pad = { top: 16, right: 12, bottom: 36, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 0);
  const chartMax = max === 0 ? 1 : max;
  const barW = innerW / data.length;
  const ticks = max === 0 ? [0] : [0, 0.5, 1];

  return (
    <figure className="panel">
      <h2 className="panel-title">Spending by month</h2>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label="Spending by month">
        {ticks.map((tick) => {
          const y = pad.top + innerH * (1 - tick);
          const labelValue = chartMax * tick;
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#ddd4c6" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b6258">
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
          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barW * 0.64}
                height={Math.max(h, item.value > 0 ? 2 : 0)}
                fill="#3f5c4a"
              />
              <text
                x={x + barW * 0.32}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                fill="#6b6258"
              >
                {item.label.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-muted">Last 12 months · USD</p>
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
              <div className="h-2.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
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

export function CategoryPie({ data }: { data: NamedTotal[] }) {
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

  return (
    <figure className="panel">
      <h2 className="panel-title">Spending by category</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No expenses yet.</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <svg viewBox="0 0 220 220" className="h-48 w-48 shrink-0" role="img" aria-label="Spending by category">
            {slices.length === 1 ? (
              <circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
            ) : (
              slices.map((slice) => (
                <path
                  key={slice.label}
                  d={describeSlice(cx, cy, r, slice.start, slice.end)}
                  fill={slice.color}
                />
              ))
            )}
            <circle cx={cx} cy={cy} r={48} fill="#fbf8f1" />
          </svg>
          <ul className="grid w-full gap-2 text-sm">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: slice.color }}
                  />
                  {slice.label}
                </span>
                <span className="text-muted">{formatMoney(slice.value)}</span>
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
