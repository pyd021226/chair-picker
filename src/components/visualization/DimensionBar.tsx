// ============================================================
// 维度对比条 v5 — 全部统一范围型，同轴显示
// ============================================================

import type { FitStatus, DimensionKey } from "@/engine/types";

interface Props {
  dimKey: DimensionKey;
  label: string; userMin: number; userMax: number;
  chairMin: number; chairMax: number; coverage: number;
  status: FitStatus; unit?: string;
}

const T: Record<FitStatus, { bg: string; bar: string; text: string }> = {
  good: { bg: "bg-emerald-50", bar: "#10b981", text: "text-emerald-700" },
  marginal: { bg: "bg-amber-50", bar: "#f59e0b", text: "text-amber-700" },
  poor: { bg: "bg-red-50", bar: "#ef4444", text: "text-red-600" },
};

export default function DimensionBar(p: Props) {
  const { dimKey, label, userMin, userMax, chairMin, chairMax, coverage, status, unit = "cm" } = p;
  const pct = Math.round(coverage * 100);
  const s = T[status];
  const sl = status === "good" ? "匹配" : status === "marginal" ? "尚可" : "不合适";
  const um = userMin, uM = userMax, cm = chairMin, cM = chairMax;
  const cSingle = cm === cM, uSingle = um === uM;

  const allMin = Math.min(um, cm), allMax = Math.max(uM, cM);
  const span = allMax - allMin || 1;
  const pad = span * 0.4;
  const vMin = allMin - pad, vMax = allMax + pad, vS = vMax - vMin || 1;
  const L = (v: number) => ((v - vMin) / vS) * 100;
  const W = (a: number, b: number) => Math.max(cSingle ? 12 : 2, Math.abs(b - a) / vS * 100);
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
        <div className="absolute rounded border-2 border-neutral-400 bg-neutral-200/70 flex items-center justify-center"
          style={{ left: `${chairL}%`, width: `${chairW}%`, top: 0, height: 40 }}>
          {chairW > 8 && <span className="text-[10px] text-neutral-600 font-medium truncate px-1">
            椅子 {f(cm)}{cSingle ? "" : `-${f(cM)}`}</span>}
        </div>
        <div className="absolute rounded flex items-center justify-center"
          style={{ left: `${L(um)}%`, width: `${W(um, uM)}%`, top: 10, height: 24, backgroundColor: s.bar }}>
          {W(um, uM) > 10 && <span className="text-[10px] text-white font-semibold truncate px-1">
            你 {f(um)}{uSingle ? "" : `-${f(uM)}`}</span>}
        </div>
        {hasOverlap && (
          <div className="absolute rounded-sm border-2 border-white/70 flex items-center justify-center"
            style={{ left: `${L(oMin)}%`, width: `${W(oMin, oMax)}%`, top: 10, height: 24, backgroundColor: "rgba(255,255,255,0.3)" }}>
            {W(oMin, oMax) > 10 && <span className="text-[8px] text-neutral-500 font-medium">重叠 {f(oMin)}-{f(oMax)}</span>}
          </div>)}
        {!hasOverlap && (<>
          <div className="absolute bg-red-400 rounded-full"
            style={{ left: `${L(Math.min(uM, cM))}%`, width: `${W(Math.min(uM, cM), Math.max(um, cm))}%`, top: 21, height: 3 }}/>
          <span className="absolute text-[9px] text-red-500 font-semibold whitespace-nowrap"
            style={{ left: "50%", transform: "translateX(-50%)", top: 26 }}>← {gapLabel}{unit} →</span>
        </>)}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-400">
        <span>{vMin.toFixed(0)}</span><span>{((vMin+vMax)/2).toFixed(0)}</span><span>{vMax.toFixed(0)}</span>
      </div>
      <p className="text-[10px] text-neutral-500 mt-1.5">
        {dimKey === "seatWidth" && status === "good" && "✅ 椅子比你需要的宽，坐宽充裕"}
        {dimKey === "seatWidth" && status === "poor" && "❌ 椅子比你需要的窄，太窄了"}
        {dimKey !== "seatWidth" && status === "good" && hasOverlap && "✅ 你的需求在椅子可调范围之内"}
        {dimKey !== "seatWidth" && status === "good" && !hasOverlap && "✅ 条件满足"}
        {dimKey !== "seatWidth" && status === "marginal" && `⚠️ 偏差${gapLabel}${unit}，勉强可用`}
        {dimKey !== "seatWidth" && status === "poor" && `❌ 偏差${gapLabel}${unit}，不建议`}
      </p>
    </div>
  );
}

function f(n: number): string { return n === Math.round(n) ? String(Math.round(n)) : n.toFixed(1); }
