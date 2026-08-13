// ============================================================
// 雷达图 — 椅子规格雷达：每个轴画椅子的实际可调范围
// 每个轴用该维度自己的物理刻度（cm/kg/级），画椅子的 min~max 区间
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

/** 每个维度的物理刻度（轴的 min~max） */
const AXIS_SCALES: Record<string, { min: number; max: number; unit: string }> = {
  seatHeight: { min: 38, max: 58, unit: "cm" },
  seatDepth: { min: 38, max: 55, unit: "cm" },
  seatWidth: { min: 40, max: 58, unit: "cm" },
  backHeight: { min: 40, max: 75, unit: "cm" },
  backWidth: { min: 35, max: 58, unit: "cm" },
  armrestWidth: { min: 40, max: 58, unit: "cm" },
  headrestRange: { min: 10, max: 35, unit: "cm" },
  lumbarPosition: { min: 10, max: 35, unit: "cm" },
  seatFirmness: { min: 1, max: 10, unit: "级" },
  reclineTension: { min: 1, max: 10, unit: "级" },
  lumbarTension: { min: 1, max: 10, unit: "级" },
  capacity: { min: 60, max: 200, unit: "kg" },
};

/** 从椅子数据提取某维度的实际范围 */
function getChairRange(chair: any, key: string): { min: number; max: number } | null {
  const single = (v: number | null | undefined) => v != null ? { min: v, max: v } : null;
  switch (key) {
    case "seatHeight": return chair.seatHeight || null;
    case "seatDepth": return chair.seatDepth || null;
    case "seatWidth": return single(chair.seatWidth);
    case "backHeight": return chair.backHeight || null;
    case "backWidth": return single(chair.backWidth);
    case "armrestWidth": return single(chair.armrestWidth);
    case "headrestRange": return chair.headrestHeight || null;
    case "lumbarPosition": return single(chair.lumbarHeight);
    case "capacity": return single(chair.maxWeight);
    default: return null;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function fmt(v: number): string {
  return v === Math.round(v) ? String(Math.round(v)) : v.toFixed(1);
}

/** 单张椅子规格雷达图 */
export function RadarChart({ title, items, chair }: { title: string; items: { key: string; label: string }[]; chair: any }) {
  const n = items.length;
  const cx = 150, cy = 150, r = 100;

  function point(value: number, i: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = r * value;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  }

  // 每个维度的范围（归一化到 0~1）
  const ranges = items.map((item, i) => {
    const scale = AXIS_SCALES[item.key];
    const cr = getChairRange(chair, item.key);
    if (!scale || !cr) return { item, i, hasData: false } as any;
    const minNorm = clamp((cr.min - scale.min) / (scale.max - scale.min), 0, 1);
    const maxNorm = clamp((cr.max - scale.min) / (scale.max - scale.min), 0, 1);
    return { item, i, hasData: true, minNorm, maxNorm, cr, scale };
  });

  const withData = ranges.filter((r: any) => r.hasData);
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
            const rng = ranges[i];
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
                  fill={rng.hasData ? "#374151" : "#b0b0b0"}
                >
                  {item.label}
                </text>
                {/* 椅子范围值 / 暂未数据 */}
                <text
                  x={point(1.38, i).x}
                  y={point(1.38, i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fill={rng.hasData ? "#2c5ea8" : "#c0c0c0"}
                >
                  {rng.hasData ? `${fmt(rng.cr.min)}-${fmt(rng.cr.max)}${rng.scale.unit}` : "暂未数据"}
                </text>
              </g>
            );
          })}

          {/* 椅子范围：min 多边形（虚线）+ max 多边形（实线）+ 中间填充 */}
          {withData.length >= 3 && (
            <>
              {/* 范围填充（min 和 max 之间的区域） */}
              <polygon
                points={ranges.filter((r: any) => r.hasData).map((r: any) => { const p = point(r.maxNorm, r.i); return `${p.x},${p.y}`; }).join(" ") + " " + ranges.filter((r: any) => r.hasData).reverse().map((r: any) => { const p = point(r.minNorm, r.i); return `${p.x},${p.y}`; }).join(" ")}
                fill="rgba(44,94,168,0.12)"
                stroke="none"
              />
              {/* max 多边形（椅子上限） */}
              <polygon
                points={ranges.filter((r: any) => r.hasData).map((r: any) => { const p = point(r.maxNorm, r.i); return `${p.x},${p.y}`; }).join(" ")}
                fill="none"
                stroke="#2c5ea8"
                strokeWidth="2"
              />
              {/* min 多边形（椅子下限） */}
              <polygon
                points={ranges.filter((r: any) => r.hasData).map((r: any) => { const p = point(r.minNorm, r.i); return `${p.x},${p.y}`; }).join(" ")}
                fill="none"
                stroke="#2c5ea8"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />
              {/* 数据点 */}
              {ranges.filter((r: any) => r.hasData).map((r: any) => (
                <g key={r.item.key}>
                  <circle cx={point(r.maxNorm, r.i).x} cy={point(r.maxNorm, r.i).y} r="3.5" fill="#2c5ea8" stroke="white" strokeWidth="1" />
                  <circle cx={point(r.minNorm, r.i).x} cy={point(r.minNorm, r.i).y} r="3" fill="#8bb0d6" stroke="white" strokeWidth="1" />
                </g>
              ))}
            </>
          )}

          {/* 少于3个维度有数据时，只画范围线段 */}
          {withData.length > 0 && withData.length < 3 && ranges.filter((r: any) => r.hasData).map((r: any) => {
            const pMin = point(r.minNorm, r.i);
            const pMax = point(r.maxNorm, r.i);
            return <line key={r.item.key} x1={pMin.x} y1={pMin.y} x2={pMax.x} y2={pMax.y} stroke="#2c5ea8" strokeWidth="3" strokeLinecap="round" />;
          })}
        </svg>
      </div>
    </div>
  );
}
