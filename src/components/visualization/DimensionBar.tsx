// ============================================================
// 维度匹配度进度条 — 新版：同一行对比，重叠高亮
// ============================================================

import type { FitStatus } from "@/engine/types";

interface Props {
  label: string;
  userMin: number;
  userMax: number;
  chairMin: number;
  chairMax: number;
  coverage: number;
  status: FitStatus;
  unit?: string;
}

const statusColors: Record<FitStatus, { bg: string; bar: string; text: string; label: string }> = {
  good:      { bg: "bg-emerald-50",  bar: "bg-emerald-500", text: "text-emerald-700", label: "✓ 匹配" },
  marginal:  { bg: "bg-amber-50",    bar: "bg-amber-400",   text: "text-amber-700",   label: "△ 尚可" },
  poor:      { bg: "bg-red-50",      bar: "bg-red-400",     text: "text-red-600",     label: "✗ 不合适" },
};

export default function DimensionBar({
  label, userMin, userMax, chairMin, chairMax, coverage, status, unit = "cm",
}: Props) {
  const pct = Math.round(coverage * 100);
  const c = statusColors[status];

  // 计算可视范围
  const allMin = Math.min(userMin, chairMin);
  const allMax = Math.max(userMax, chairMax);
  const pad = Math.max(2, (allMax - allMin) * 0.25);
  const visMin = allMin - pad;
  const visMax = allMax + pad;
  const visSpan = visMax - visMin || 1;

  function left(v: number) { return ((v - visMin) / visSpan) * 100; }
  function width(a: number, b: number) { return Math.max(2, (Math.abs(b - a) / visSpan) * 100); }

  // 重叠区
  const overlapMin = Math.max(userMin, chairMin);
  const overlapMax = Math.min(userMax, chairMax);
  const hasOverlap = overlapMin < overlapMax;

  // 判断方向
  const userBelow = userMax < chairMin;  // 用户完全在椅子下方（椅子太高）
  const userAbove = userMin > chairMax;  // 用户完全在椅子上面（椅子太矮）
  const noOverlap = userBelow || userAbove;

  return (
    <div className={`rounded-xl p-4 ${c.bg} border border-neutral-100`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-neutral-800">{label}</span>
        <div className="flex items-center gap-2">
          {noOverlap && (
            <span className="text-[10px] text-neutral-500">
              {userBelow ? `椅子偏低 ${(chairMax - userMin).toFixed(0)}${unit}` : `椅子偏高 ${(userMax - chairMin).toFixed(0)}${unit}`}
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
            {c.label} {pct}%
          </span>
        </div>
      </div>

      {/* Visual comparison — single line */}
      <div className="relative h-14 mb-1">
        {/* 椅子范围（灰色底色） */}
        <div
          className="absolute top-1 h-6 rounded-md bg-neutral-300/70 border border-neutral-400 flex items-center justify-center"
          style={{ left: `${left(chairMin)}%`, width: `${width(chairMin, chairMax)}%` }}
        >
          <span className="text-[10px] text-neutral-600 font-medium truncate px-1">
            椅子 {fmt(chairMin)}-{fmt(chairMax)}
          </span>
        </div>

        {/* 你的需求（彩色条） */}
        <div
          className={`absolute top-8 h-6 rounded-md ${c.bar} flex items-center justify-center shadow-sm`}
          style={{ left: `${left(userMin)}%`, width: `${width(userMin, userMax)}%` }}
        >
          <span className="text-[10px] text-white font-semibold truncate px-1">
            你 {fmt(userMin)}-{fmt(userMax)}
          </span>
        </div>

        {/* 重叠高亮线 */}
        {hasOverlap && (
          <div className="absolute top-[28px] left-0 right-0 flex items-center" style={{ height: 4 }}>
            <div
              className="h-full rounded-full bg-white/80 border border-neutral-300"
              style={{ marginLeft: `${left(overlapMin)}%`, width: `${width(overlapMin, overlapMax)}%` }}
            />
            <div className="absolute text-[9px] text-neutral-500 whitespace-nowrap"
              style={{ left: `${left((overlapMin + overlapMax) / 2)}%`, transform: "translateX(-50%)", top: 4 }}>
              重叠 {fmt(overlapMin)}-{fmt(overlapMax)}
            </div>
          </div>
        )}

        {/* 无重叠时显示间隙 */}
        {noOverlap && (
          <div className="absolute top-[30px] left-0 right-0 flex items-center justify-center" style={{ height: 4 }}>
            <div
              className="h-0.5 bg-red-400"
              style={{
                marginLeft: `${left(Math.min(userMax, chairMax))}%`,
                width: `${width(Math.min(userMax, chairMax), Math.max(userMin, chairMin))}%`,
              }}
            />
            <span
              className="absolute text-[9px] text-red-500 font-semibold whitespace-nowrap"
              style={{ left: "50%", transform: "translateX(-50%)", top: 5 }}
            >
              ← 差 {(userBelow ? userMin - chairMax : chairMin - userMax).toFixed(0)}{unit} →
            </span>
          </div>
        )}
      </div>

      {/* Scale */}
      <div className="flex justify-between text-[10px] text-neutral-400 mt-2">
        <span>{visMin.toFixed(0)}{unit}</span>
        <span>{((visMin + visMax) / 2).toFixed(0)}{unit}</span>
        <span>{visMax.toFixed(0)}{unit}</span>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return n === Math.round(n) ? String(Math.round(n)) : n.toFixed(1);
}
