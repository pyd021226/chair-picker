// ============================================================
// 维度对比条 v4 — 按维度类型区分视觉
//  坐高/坐深 = 范围重叠型，坐宽 = 阈值型（≥ 即匹配）
// ============================================================

import type { FitStatus, DimensionKey } from "@/engine/types";

interface Props {
  dimKey: DimensionKey;
  label: string; userMin: number; userMax: number;
  chairMin: number; chairMax: number; coverage: number;
  status: FitStatus; unit?: string;
  effectiveMin?: number; // 坐深专用：2/3有效区起点
}

const T: Record<FitStatus, { bg: string; bar: string; text: string }> = {
  good: { bg: "bg-emerald-50", bar: "#10b981", text: "text-emerald-700" },
  marginal: { bg: "bg-amber-50", bar: "#f59e0b", text: "text-amber-700" },
  poor: { bg: "bg-red-50", bar: "#ef4444", text: "text-red-600" },
};

export default function DimensionBar(p: Props) {
  const { dimKey, label, userMin, userMax, chairMin, chairMax, coverage, status, unit = "cm", effectiveMin } = p;
  const pct = Math.round(coverage * 100);
  const s = T[status];
  const sl = status === "good" ? "匹配" : status === "marginal" ? "尚可" : "不合适";
  const um = userMin, uM = userMax, cm = chairMin, cM = chairMax;

  // ====== 坐宽：阈值型 ======
  if (dimKey === "seatWidth") {
    const chairWider = cm >= um;
    const lo = Math.min(um, cm) - 5, hi = Math.max(um, cm) + 5, vs = hi - lo || 1;
    const L = (v: number) => ((v - lo) / vs) * 100;
    const W = (a: number, b: number) => Math.max(2, Math.abs(b - a) / vs * 100);
    return (
      <div className={`rounded-xl p-4 ${s.bg} border border-neutral-100`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-neutral-800">{label}</span>
          <span className={`text-xs font-bold ${s.text}`}>{sl} {pct}%</span>
        </div>
        <div className="relative mx-2" style={{ height: 36, marginBottom: 20 }}>
          {/* 用户需求（从需求值到椅子值或到自身） */}
          <div className="absolute rounded flex items-center justify-center"
            style={{ left: `${L(um)}%`, width: `${chairWider ? W(um, cm) : 3}%`, top: 4, height: 28, backgroundColor: s.bar }}>
            <span className="text-[10px] text-white font-semibold px-1">你需要 ≥ {f(um)}</span>
          </div>
          {/* 椅子值 */}
          <div className="absolute rounded border-2 border-neutral-400 bg-neutral-200/70 flex items-center justify-center"
            style={{ left: `${L(cm)}%`, width: `${Math.max(8, W(cm, cm))}%`, top: 0, height: 36, transform: "translateX(-50%)" }}>
            <span className="text-[10px] text-neutral-700 font-semibold whitespace-nowrap px-1">椅子 {f(cm)}</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-500 mt-1.5">
          {chairWider
            ? `✅ 椅子比你需要的宽 ${(cm - um).toFixed(0)}${unit}，坐宽充裕`
            : `❌ 椅子比你需要的窄 ${(um - cm).toFixed(0)}${unit}，太窄了`}
        </p>
      </div>
    );
  }

  // ====== 坐高 / 坐深：范围重叠型 ======
  const isSeatDepth = dimKey === "seatDepth";
  const cSingle = cm === cM;
  const allMin = Math.min(um, cm), allMax = Math.max(uM, cM);
  const span = allMax - allMin || 1;
  // 固定值椅子给予更大的视觉宽度
  const pad = span * 0.4;
  const vMin = allMin - pad, vMax = allMax + pad, vS = vMax - vMin || 1;
  const L = (v: number) => ((v - vMin) / vS) * 100;
  // 固定值至少占视觉宽度12%，范围值至少2%
  const W = (a: number, b: number) => Math.max(cSingle ? 12 : 2, Math.abs(b - a) / vS * 100);

  // 固定值时，L稍微左移使条居中（因为条有最小宽度）
  const chairL = cSingle ? L(cm) - W(cm, cM) / 2 : L(cm);
  const chairW = W(cm, cM);
  const oMin = Math.max(um, cm), oMax = Math.min(uM, cM);
  const hasOverlap = oMin < oMax;
  const gap = hasOverlap ? 0 : um > cM ? um - cM : cm - uM;
  const gapLabel = um > cM ? `偏低${gap.toFixed(0)}` : `偏高${gap.toFixed(0)}`;

  return (
    <div className={`rounded-xl p-4 ${s.bg} border border-neutral-100`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-neutral-800">{label}</span>
        <span className={`text-xs font-bold ${s.text}`}>{sl} {pct}%</span>
      </div>
      <div className="relative mx-2" style={{ height: 52, marginBottom: 22 }}>
        {/* 椅子完整范围 — 灰色条 */}
        <div className="absolute rounded border-2 border-neutral-400 bg-neutral-200/70 flex items-center justify-center"
          style={{ left: `${chairL}%`, width: `${chairW}%`, top: 0, height: 40 }}>
          {chairW > 8 && (
            <span className="text-[10px] text-neutral-600 font-medium truncate px-1">
              椅子 {f(cm)}{cSingle ? "" : `-${f(cM)}`}
            </span>
          )}
        </div>

        {/* 坐深专用：2/3有效区（浅黄底色） */}
        {isSeatDepth && effectiveMin !== undefined && (
          <div className="absolute rounded-r"
            style={{ left: `${L(effectiveMin)}%`, width: `${W(effectiveMin, cM)}%`, top: 0, height: 40,
              backgroundColor: "rgba(251,191,36,0.12)", borderRight: "2px dashed rgba(251,191,36,0.5)" }}>
            <span className="absolute -top-4 right-1 text-[8px] text-amber-500 whitespace-nowrap">2/3有效区</span>
          </div>
        )}

        {/* 你的需求 — 彩色条 */}
        <div className="absolute rounded flex items-center justify-center"
          style={{ left: `${L(um)}%`, width: `${W(um, uM)}%`, top: 10, height: 24, backgroundColor: s.bar }}>
          {W(um, uM) > 10 && (
            <span className="text-[10px] text-white font-semibold truncate px-1">
              你 {f(um)}{um === uM ? "" : `-${f(uM)}`}
            </span>
          )}
        </div>

        {/* 重叠区高亮 */}
        {hasOverlap && (
          <div className="absolute rounded-sm border-2 border-white/70 flex items-center justify-center"
            style={{ left: `${L(oMin)}%`, width: `${W(oMin, oMax)}%`, top: 10, height: 24, backgroundColor: "rgba(255,255,255,0.3)" }}>
            {W(oMin, oMax) > 10 && <span className="text-[8px] text-neutral-500 font-medium">重叠 {f(oMin)}-{f(oMax)}</span>}
          </div>
        )}

        {/* 无重叠：红色间隙 */}
        {!hasOverlap && (
          <>
            <div className="absolute bg-red-400 rounded-full"
              style={{ left: `${L(Math.min(uM, cM))}%`, width: `${W(Math.min(uM, cM), Math.max(um, cm))}%`, top: 21, height: 3 }} />
            <span className="absolute text-[9px] text-red-500 font-semibold whitespace-nowrap"
              style={{ left: "50%", transform: "translateX(-50%)", top: 26 }}>← {gapLabel}{unit} →</span>
          </>
        )}
      </div>

      {/* 刻度 */}
      <div className="flex justify-between text-[10px] text-neutral-400">
        <span>{vMin.toFixed(0)}</span><span>{((vMin+vMax)/2).toFixed(0)}</span><span>{vMax.toFixed(0)}</span>
      </div>

      {/* 说明 */}
      <p className="text-[10px] text-neutral-500 mt-1.5 leading-relaxed">
        {status === "good" && hasOverlap && "✅ 你的需求完全在椅子可调范围之内"}
        {status === "good" && !hasOverlap && "✅ 条件满足"}
        {status === "marginal" && `⚠️ 偏差${gapLabel}${unit}，勉强可用`}
        {status === "poor" && `❌ 偏差${gapLabel}${unit}，不建议`}
        {isSeatDepth && ` · 有效覆盖区：${effectiveMin !== undefined ? f(effectiveMin) : "?"}-${f(cM)}${unit}`}
      </p>
    </div>
  );
}

function f(n: number): string { return n === Math.round(n) ? String(Math.round(n)) : n.toFixed(1); }
