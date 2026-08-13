// ============================================================
// 雷达图对比 — 尺寸/坐感/功能 三个雷达图
// 已激活维度（坐高/坐深/坐宽）显示彩色，其余灰色"暂未数据"
// ============================================================

"use client";

import type { DimensionResult } from "@/engine/types";

interface Props {
  dimensions: DimensionResult[];
}

/** 已激活（有评分代码）的维度 */
export const ACTIVATED = new Set(["seatHeight", "seatDepth", "seatWidth"]);

/** 三个分类 */
export const CATEGORIES = [
  {
    title: "尺寸",
    items: [
      { key: "seatHeight", label: "坐高" },
      { key: "seatDepth", label: "坐深" },
      { key: "seatWidth", label: "坐宽" },
      { key: "backHeight", label: "背高" },
      { key: "backWidth", label: "背宽" },
      { key: "armrestWidth", label: "扶手间距宽" },
      { key: "headrestRange", label: "头枕范围" },
      { key: "lumbarPosition", label: "腰撑位置" },
    ],
  },
  {
    title: "坐感",
    items: [
      { key: "seatFirmness", label: "坐垫软硬" },
      { key: "reclineTension", label: "后仰力度" },
      { key: "lumbarTension", label: "腰撑力度" },
    ],
  },
  {
    title: "功能",
    items: [
      { key: "lumbarFunc", label: "腰撑功能" },
      { key: "headrestFunc", label: "头枕功能" },
      { key: "armrestFunc", label: "扶手功能" },
      { key: "capacity", label: "五星杆" },
    ],
  },
];

/** 单张雷达图 */
export function RadarChart({ title, items, dimMap }: { title: string; items: { key: string; label: string }[]; dimMap: Record<string, DimensionResult> }) {
  const n = items.length;
  const cx = 150, cy = 150, r = 100;

  function point(value: number, i: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = r * value;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  // 有数据的维度（椅子数据存在就显示真实）
  const activeAxes: { label: string; coverage: number; i: number }[] = [];
  items.forEach((item, i) => {
    const dim = dimMap[item.key];
    if (dim && !dim.chairDataMissing) {
      activeAxes.push({ label: item.label, coverage: dim.coverage, i });
    }
  });

  // 网格
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
        <span className="text-sm font-semibold text-neutral-700">{title}</span>
      </div>
      <div className="flex justify-center p-2">
        <svg viewBox="0 0 300 300" className="w-full max-w-xs h-auto">
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

          {/* 轴线 + 标签 */}
          {items.map((item, i) => {
            const p = point(1, i);
            const dim = dimMap[item.key];
            const isActive = dim && !dim.chairDataMissing;

            return (
              <g key={item.key}>
                {/* 从中心点出发的轴线（辐条） */}
                <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#d1d5db" strokeWidth="1.5" />
                <text
                  x={point(1.22, i).x}
                  y={point(1.22, i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isActive ? "#374151" : "#9ca3af"}
                >
                  {item.label}
                </text>
                {/* 数值 / 暂未数据 */}
                <text
                  x={point(1.38, i).x}
                  y={point(1.38, i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill={isActive ? "#3b82f6" : "#b0b0b0"}
                >
                  {isActive ? `${Math.round(dim!.coverage * 100)}%` : "暂未数据"}
                </text>
              </g>
            );
          })}

          {/* 激活维度多边形（只有激活且有数据的维度才画） */}
          {activeAxes.length >= 3 && (
            <>
              <polygon
                points={activeAxes.map((a) => { const p = point(a.coverage, a.i); return `${p.x},${p.y}`; }).join(" ")}
                fill="rgba(59,130,246,0.15)"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {activeAxes.map((a) => {
                const p = point(a.coverage, a.i);
                return <circle key={a.label} cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" />;
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

export default function RadarComparison({ dimensions }: Props) {
  const dimMap: Record<string, DimensionResult> = {};
  for (const d of dimensions) dimMap[d.key] = d;

  return (
    <div className="space-y-3">
      <div className="flex gap-3 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> 已激活维度</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-neutral-300 inline-block" /> 暂未数据</span>
      </div>
      {CATEGORIES.map((cat) => (
        <RadarChart key={cat.title} title={cat.title} items={cat.items} dimMap={dimMap} />
      ))}
    </div>
  );
}
