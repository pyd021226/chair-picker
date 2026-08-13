// ============================================================
// 雷达图 — 评分雷达：每个轴显示该维度的匹配分数（0-100%）
// 已激活维度（坐高/坐深/坐宽）显示真实分数，其余灰色"暂未数据"
// ============================================================

"use client";

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

/** 单张评分雷达图 */
export function RadarChart({ title, items, dimMap }: { title: string; items: { key: string; label: string }[]; dimMap: Record<string, any> }) {
  const n = items.length;
  const cx = 150, cy = 150, r = 100;

  function point(value: number, i: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = r * value;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  // 有分数的维度（激活且有椅子数据）
  const scored = items.map((item, i) => {
    const dim = dimMap[item.key];
    const hasScore = dim && ACTIVATED.has(item.key) && !dim.chairDataMissing;
    return { item, i, hasScore, coverage: hasScore ? dim.coverage : 0 };
  });

  const scoredAxes = scored.filter((s) => s.hasScore);
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-float overflow-hidden">
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
        <span className="text-sm font-semibold text-neutral-700">{title}</span>
      </div>
      <div className="flex justify-center p-2">
        <svg viewBox="0 0 300 300" className="w-full max-w-xs h-auto">
          {/* 网格 */}
          {gridLevels.map((lv) => (
            <polygon
              key={lv}
              points={Array.from({ length: n }, (_, i) => { const p = point(lv, i); return `${p.x},${p.y}`; }).join(" ")}
              fill="none"
              stroke="#eef0f2"
              strokeWidth="0.5"
            />
          ))}

          {/* 辐条 + 标签 */}
          {items.map((item, i) => {
            const p = point(1, i);
            const s = scored[i];
            return (
              <g key={item.key}>
                <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#dde1e6" strokeWidth="1" />
                <text
                  x={point(1.22, i).x}
                  y={point(1.22, i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={s.hasScore ? "#374151" : "#b0b0b0"}
                >
                  {item.label}
                </text>
                <text
                  x={point(1.38, i).x}
                  y={point(1.38, i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill={s.hasScore ? "#2c5ea8" : "#c0c0c0"}
                >
                  {s.hasScore ? `${Math.round(s.coverage * 100)}%` : "暂未数据"}
                </text>
              </g>
            );
          })}

          {/* 分数多边形（只连接有分数的维度） */}
          {scoredAxes.length >= 3 && (
            <>
              <polygon
                points={scoredAxes.map((s) => { const p = point(s.coverage, s.i); return `${p.x},${p.y}`; }).join(" ") + " " + cx + "," + cy}
                fill="rgba(44,94,168,0.15)"
                stroke="#2c5ea8"
                strokeWidth="1.5"
              />
              {scoredAxes.map((s) => {
                const p = point(s.coverage, s.i);
                return <circle key={s.item.key} cx={p.x} cy={p.y} r="4" fill="#2c5ea8" stroke="white" strokeWidth="1.5" />;
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
