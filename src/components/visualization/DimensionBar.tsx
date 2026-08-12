// ============================================================
// 维度匹配度进度条
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

const statusColors: Record<FitStatus, string> = {
  good: "bg-emerald-500",
  marginal: "bg-amber-400",
  poor: "bg-red-400",
};

const statusBgColors: Record<FitStatus, string> = {
  good: "bg-emerald-50",
  marginal: "bg-amber-50",
  poor: "bg-red-50",
};

const statusLabels: Record<FitStatus, string> = {
  good: "✓ 匹配",
  marginal: "△ 尚可",
  poor: "✗ 不匹配",
};

export default function DimensionBar({
  label,
  userMin,
  userMax,
  chairMin,
  chairMax,
  coverage,
  status,
  unit = "cm",
}: Props) {
  const pct = Math.round(coverage * 100);
  const userRange = userMax - userMin;
  const chairRange = chairMax - chairMin;
  // 计算可视化范围：取用户范围和椅子范围的并集，加 20% 边距
  const visMin = Math.floor(Math.min(userMin, chairMin) - userRange * 0.1);
  const visMax = Math.ceil(Math.max(userMax, chairMax) + userRange * 0.1);
  const visSpan = visMax - visMin;

  function pos(v: number) {
    return ((v - visMin) / visSpan) * 100;
  }

  return (
    <div className={`rounded-xl p-4 ${statusBgColors[status]} border border-neutral-100`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-800">{label}</span>
        <span className={`text-xs font-semibold ${status === "good" ? "text-emerald-600" : status === "marginal" ? "text-amber-600" : "text-red-500"}`}>
          {statusLabels[status]} {pct}%
        </span>
      </div>

      {/* Visual bar */}
      <div className="relative h-8 mb-2">
        {/* Chair range bar (full width) */}
        <div
          className="absolute top-0 h-8 rounded-lg bg-neutral-200/60 border border-neutral-300"
          style={{
            left: `${pos(chairMin)}%`,
            width: `${Math.max(1, chairRange / visSpan * 100)}%`,
          }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-neutral-500 whitespace-nowrap">
            椅子 {chairMin === chairMax ? chairMin : `${chairMin}-${chairMax}`}
          </span>
        </div>

        {/* User ideal range overlay */}
        <div
          className={`absolute top-1 h-6 rounded-md ${statusColors[status]} opacity-80`}
          style={{
            left: `${pos(userMin)}%`,
            width: `${Math.max(1, userRange / visSpan * 100)}%`,
          }}
        >
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-neutral-600 whitespace-nowrap font-medium">
            你需要 {userMin === userMax ? userMin : `${userMin}-${userMax}`}
          </span>
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-neutral-400 mt-5">
        <span>{visMin}{unit}</span>
        <span>{Math.round((visMin + visMax) / 2)}{unit}</span>
        <span>{visMax}{unit}</span>
      </div>
    </div>
  );
}
