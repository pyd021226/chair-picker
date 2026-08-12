// ============================================================
// 维度对比条 v6 — 标签外置 + 优化比例 + 完美匹配蓝色
// ============================================================

import type { FitStatus, DimensionKey } from "@/engine/types";

interface Props {
  dimKey: DimensionKey;
  label: string; userMin: number; userMax: number;
  chairMin: number; chairMax: number; coverage: number;
  status: FitStatus; unit?: string;
}

const barColors = {
  perfect: { bg: "bg-blue-50", bar: "#3b82f6", text: "text-blue-700", label: "完美契合" },
  good:    { bg: "bg-emerald-50", bar: "#10b981", text: "text-emerald-700", label: "匹配" },
  marginal:{ bg: "bg-amber-50",  bar: "#f59e0b",  text: "text-amber-700",  label: "尚可" },
  poor:    { bg: "bg-red-50",    bar: "#ef4444",   text: "text-red-600",    label: "不合适" },
};

export default function DimensionBar(p: Props) {
  const { dimKey, label, userMin, userMax, chairMin, chairMax, coverage, status, unit = "cm" } = p;
  const pct = Math.round(coverage * 100);
  const isPerfect = coverage >= 0.999;
  const c = isPerfect ? barColors.perfect : barColors[status];
  const sl = isPerfect ? "完美契合" : c.label;

  const um = userMin, uM = userMax, cm = chairMin, cM = chairMax;
  const uSingle = um === uM, cSingle = cm === cM;

  // 计算坐标
  const allMin = Math.min(um, cm), allMax = Math.max(uM, cM);
  const span = allMax - allMin || 1;
  const pad = span * 0.45;
  const vMin = allMin - pad, vMax = allMax + pad, vS = vMax - vMin || 1;
  const L = (v: number) => ((v - vMin) / vS) * 100;
  const rawW = (a: number, b: number) => Math.abs(b - a) / vS * 100;
  const barW = (a: number, b: number) => Math.max(cSingle ? 10 : 3, rawW(a, b));

  // 重叠
  const oMin = Math.max(um, cm), oMax = Math.min(uM, cM);
  const hasOverlap = oMin < oMax;
  const gap = hasOverlap ? 0 : um > cM ? um - cM : cm - uM;
  const gapLabel = um > cM ? `偏低${gap.toFixed(0)}` : `偏高${gap.toFixed(0)}`;

  const chairMid = (cm + cM) / 2;
  const userMid = (um + uM) / 2;

  return (
    <div className={`rounded-xl p-4 ${c.bg}`}>
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-neutral-800">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
            {sl} {pct}%
          </span>
        </div>
      </div>

      {/* 可视化 */}
      <div className="relative mx-3" style={{ height: 64 }}>
        {/* ===== 椅子标签（上方） ===== */}
        <span
          className="absolute text-[10px] text-neutral-600 font-semibold whitespace-nowrap"
          style={{ left: `${L(chairMid)}%`, top: 0, transform: "translateX(-50%)" }}
        >
          🪑 {f(cm)}{cSingle ? "" : `-${f(cM)}`}
        </span>

        {/* ===== 灰色椅子条 ===== */}
        <div
          className="absolute rounded-md border-2 border-neutral-300 bg-neutral-200/80"
          style={{ left: `${L(cm)}%`, width: `${barW(cm, cM)}%`, top: 16, height: 20 }}
        />

        {/* ===== 彩色用户条 ===== */}
        <div
          className="absolute rounded-md"
          style={{ left: `${L(um)}%`, width: `${barW(um, uM)}%`, top: 40, height: 20, backgroundColor: c.bar }}
        />

        {/* ===== 用户标签（下方） ===== */}
        <span
          className="absolute text-[10px] text-neutral-700 font-semibold whitespace-nowrap"
          style={{ left: `${L(userMid)}%`, top: 62, transform: "translateX(-50%)" }}
        >
          👤 {f(um)}{uSingle ? "" : `-${f(uM)}`}
        </span>

        {/* ===== 重叠区/间隙 ===== */}
        {hasOverlap && (
          <div className="absolute flex items-center justify-center" style={{ left: `${L(oMin)}%`, width: `${Math.max(3, rawW(oMin, oMax))}%`, top: 28, height: 12 }}>
            <div className="w-full h-full rounded-sm border border-white/60"
              style={{ backgroundColor: isPerfect ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.3)" }} />
          </div>
        )}

        {!hasOverlap && (
          <div className="absolute flex items-center" style={{ left: `${L(Math.min(uM, cM))}%`, width: `${Math.max(2, rawW(Math.min(uM, cM), Math.max(um, cm)))}%`, top: 28, height: 12 }}>
            <div className="w-full h-0.5 bg-red-400 rounded-full" />
            <span className="absolute text-[9px] text-red-500 font-semibold whitespace-nowrap"
              style={{ left: "50%", transform: "translateX(-50%)", top: 6 }}>
              {gapLabel}{unit}
            </span>
          </div>
        )}
      </div>

      {/* 刻度 */}
      <div className="flex justify-between text-[10px] text-neutral-400 mt-4 px-3">
        <span>{vMin.toFixed(0)}</span>
        <span>{((vMin+vMax)/2).toFixed(0)}</span>
        <span>{vMax.toFixed(0)}</span>
      </div>
    </div>
  );
}

function f(n: number): string { return n === Math.round(n) ? String(Math.round(n)) : n.toFixed(1); }
