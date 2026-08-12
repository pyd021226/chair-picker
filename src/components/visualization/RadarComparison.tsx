// ============================================================
// 雷达图对比 — 人体数据 vs 椅子数据
// ============================================================

"use client";

import type { BodyDimensions, Chair, DimensionResult } from "@/engine/types";

interface Props {
  body: BodyDimensions;
  chair: Chair;
  dimensions: DimensionResult[];
}

/** 雷达图上每个维度的定义 */
interface Axis {
  key: string;
  label: string;
  userValue: number;   // 0-1 归一化
  chairValue: number;  // 0-1 归一化
  coverage: number;
  status: string;
  userMin: number;
  userMax: number;
  chairMin: number;
  chairMax: number;
  unit: string;
}

function fitColor(s: string): string {
  if (s === "good") return "#10b981";
  if (s === "marginal") return "#f59e0b";
  return "#ef4444";
}

export default function RadarComparison({ body, chair, dimensions }: Props) {
  // 构建雷达图轴数据
  const axes: Axis[] = [];
  for (const dim of dimensions) {
    if (dim.chairDataMissing) continue;
    if (!["seatHeight", "seatDepth", "seatWidth"].includes(dim.key)) continue;

    // 归一化到 0-1：取用户和椅子范围的并集作为满刻度
    const allMin = Math.min(dim.userIdeal.min, dim.chairRange.min);
    const allMax = Math.max(dim.userIdeal.max, dim.chairRange.max);
    const span = allMax - allMin || 1;

    // 用户值：用理想范围的中间值（或最大值，视维度而定）
    const userVal = dim.key === "seatWidth"
      ? dim.userIdeal.max / (allMax || 1) // 坐宽：用户最大需求 vs 满刻度
      : (dim.userIdeal.min + dim.userIdeal.max) / 2;
    const chairVal = dim.key === "seatWidth"
      ? dim.chairRange.max / (allMax || 1)
      : (dim.chairRange.min + dim.chairRange.max) / 2;

    // 坐宽特殊处理：从 0 开始
    const normMin = dim.key === "seatWidth" ? 0 : allMin;
    const normMax = allMax;
    const normSpan = normMax - normMin || 1;

    const userNorm = dim.key === "seatWidth"
      ? (dim.userIdeal.max - normMin) / normSpan
      : ((dim.userIdeal.min + dim.userIdeal.max) / 2 - normMin) / normSpan;
    const chairNorm = dim.key === "seatWidth"
      ? (dim.chairRange.max - normMin) / normSpan
      : ((dim.chairRange.min + dim.chairRange.max) / 2 - normMin) / normSpan;

    axes.push({
      key: dim.key,
      label: dim.label,
      userValue: Math.max(0.05, Math.min(1, userNorm)),
      chairValue: Math.max(0.05, Math.min(1, chairNorm)),
      coverage: dim.coverage,
      status: dim.status,
      userMin: dim.userIdeal.min,
      userMax: dim.userIdeal.max,
      chairMin: dim.chairRange.min,
      chairMax: dim.chairRange.max,
      unit: dim.unit,
    });
  }

  const n = axes.length;
  if (n < 3) return null;

  const cx = 150, cy = 155, r = 120;

  // 计算轴上点的坐标
  function point(value: number, i: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2; // 从顶部开始
    const dist = r * value;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  // 生成多边形路径
  function polygon(values: number[]): string {
    return values
      .map((v, i) => {
        const p = point(v, i);
        return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
      })
      .join(" ") + " Z";
  }

  // 网格线
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const userValues = axes.map((a) => a.userValue);
  const chairValues = axes.map((a) => a.chairValue);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-700">📊 雷达对比</span>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> 人体</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-neutral-400 inline-block" /> 椅子</span>
        </div>
      </div>
      <div className="flex justify-center p-2">
        <svg viewBox="0 0 300 310" className="w-full max-w-sm h-auto">
          {/* 网格 */}
          {gridLevels.map((lv) => (
            <polygon
              key={lv}
              points={Array.from({ length: n }, (_, i) => {
                const p = point(lv, i);
                return `${p.x},${p.y}`;
              }).join(" ")}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* 轴线 */}
          {axes.map((axis, i) => {
            const p = point(1, i);
            return (
              <g key={axis.key}>
                <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />
                {/* 标签 */}
                <text
                  x={point(1.15, i).x}
                  y={point(1.15, i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#374151"
                >
                  {axis.label}
                </text>
                {/* 数值 */}
                <text
                  x={point(1.28, i).x}
                  y={point(1.28, i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill={fitColor(axis.status)}
                >
                  {Math.round(axis.coverage * 100)}%
                </text>
              </g>
            );
          })}

          {/* 椅子多边形（灰色，底层） */}
          <polygon
            points={chairValues.map((v, i) => { const p = point(v, i); return `${p.x},${p.y}`; }).join(" ")}
            fill="rgba(156,163,175,0.25)"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="4,2"
          />

          {/* 人体多边形（蓝色，上层） */}
          <polygon
            points={userValues.map((v, i) => { const p = point(v, i); return `${p.x},${p.y}`; }).join(" ")}
            fill="rgba(59,130,246,0.2)"
            stroke="#3b82f6"
            strokeWidth="2.5"
          />

          {/* 数据点 */}
          {axes.map((axis, i) => (
            <g key={axis.key}>
              <circle cx={point(axis.chairValue, i).x} cy={point(axis.chairValue, i).y} r="4" fill="#9ca3af" stroke="white" strokeWidth="1.5" />
              <circle cx={point(axis.userValue, i).x} cy={point(axis.userValue, i).y} r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
            </g>
          ))}
        </svg>
      </div>

      {/* 底部数值对比 */}
      <div className="px-4 pb-3 space-y-1">
        {axes.map((axis) => (
          <div key={axis.key} className="flex items-center gap-2 text-[10px]">
            <span className="w-10 text-neutral-500">{axis.label}</span>
            <span className="text-blue-600 font-medium">你 {axis.userMin === axis.userMax ? axis.userMin : `${axis.userMin}-${axis.userMax}`}{axis.unit}</span>
            <span className="text-neutral-400">vs</span>
            <span className="text-neutral-600">椅子 {axis.chairMin === axis.chairMax ? axis.chairMin : `${axis.chairMin}-${axis.chairMax}`}{axis.unit}</span>
            <span className="ml-auto font-semibold" style={{ color: fitColor(axis.status) }}>{Math.round(axis.coverage * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
