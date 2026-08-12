// ============================================================
// 维度对比条 v3 — 同一行 + 重叠高亮 + 间隙标注 + 文字解释
// ============================================================

import type { FitStatus } from "@/engine/types";

interface Props {
  label: string; userMin: number; userMax: number;
  chairMin: number; chairMax: number; coverage: number;
  status: FitStatus; unit?: string;
}

const S: Record<FitStatus, { bg: string; bar: string; text: string }> = {
  good:     { bg: "bg-emerald-50",  bar: "#10b981", text: "text-emerald-700" },
  marginal: { bg: "bg-amber-50",    bar: "#f59e0b", text: "text-amber-700" },
  poor:     { bg: "bg-red-50",      bar: "#ef4444", text: "text-red-600" },
};

export default function DimensionBar(p: Props) {
  const { label, userMin, userMax, chairMin, chairMax, coverage, status, unit = "cm" } = p;
  const pct = Math.round(coverage * 100);
  const s = S[status];
  const statusLabel = status === "good" ? "匹配" : status === "marginal" ? "尚可" : "不合适";

  const um = userMin, uM = userMax, cm = chairMin, cM = chairMax;
  const uSingle = um === uM, cSingle = cm === cM;

  // 阈值型维度（单值对比）：椅子 >= 用户需求即匹配，视觉上把用户需求延伸到椅子值
  const isThreshold = uSingle && cSingle && cm >= um;
  const displayUMax = isThreshold ? Math.max(uM, cM) : uM;
  const displayUMin = isThreshold ? um : um;

  const allMin = Math.min(displayUMin, cm), allMax = Math.max(displayUMax, cM);
  const span = allMax - allMin || 1;
  const pad = span * 0.35;
  const vMin = allMin - pad, vMax = allMax + pad, vS = vMax - vMin || 1;
  const L = (v: number) => ((v - vMin) / vS) * 100;
  const W = (a: number, b: number) => Math.max(2, Math.abs(b - a) / vS * 100);

  const oMin = Math.max(um, cm), oMax = Math.min(displayUMax, cM);
  const hasOverlap = oMin < oMax;
  const gap = hasOverlap ? 0 : um > cM ? um - cM : cm - displayUMax;
  const gapLabel = um > cM ? `偏低${gap.toFixed(0)}` : `偏高${gap.toFixed(0)}`;

  return (
    <div className={`rounded-xl p-4 ${s.bg} border border-neutral-100`}>
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-neutral-800">{label}</span>
        <span className={`text-xs font-bold ${s.text}`}>{statusLabel} {pct}%</span>
      </div>

      {/* === 单一对比条 === */}
      <div className="relative mx-2" style={{ height: 44, marginBottom: 22 }}>
        {/* 灰色框：椅子可调范围 */}
        <div className="absolute rounded border-2 border-neutral-400 bg-neutral-200/70 flex items-center justify-center"
          style={{ left: `${L(cm)}%`, width: `${W(cm, cM)}%`, top: 0, height: 40 }}>
          {W(cm, cM) > 12 && (
            <span className="text-[10px] text-neutral-600 font-medium truncate px-1">
              椅子 {f(cm)}{cSingle ? "" : `-${f(cM)}`}
            </span>
          )}
        </div>

        {/* 彩色条：你的需求 */}
        <div className="absolute rounded flex items-center justify-center"
          style={{ left: `${L(um)}%`, width: `${W(um, displayUMax)}%`, top: 8, height: 24, backgroundColor: s.bar }}>
          {W(um, displayUMax) > 10 && (
            <span className="text-[10px] text-white font-semibold truncate px-1">
              你 {f(um)}{uSingle ? (isThreshold ? "≥" + f(um) : "") : `-${f(uM)}`}
            </span>
          )}
        </div>

        {/* 重叠区：白色高亮框 */}
        {hasOverlap && (
          <div className="absolute rounded-sm border-2 border-white/70 flex items-center justify-center"
            style={{ left: `${L(oMin)}%`, width: `${W(oMin, oMax)}%`, top: 8, height: 24, backgroundColor: "rgba(255,255,255,0.3)" }}>
            {W(oMin, oMax) > 10 && (
              <span className="text-[8px] text-neutral-500 font-medium">重叠 {f(oMin)}-{f(oMax)}</span>
            )}
          </div>
        )}

        {/* 无重叠：红色间隙 */}
        {!hasOverlap && (
          <>
            <div className="absolute bg-red-400 rounded-full"
              style={{ left: `${L(Math.min(uM, cM))}%`, width: `${W(Math.min(uM, cM), Math.max(um, cm))}%`, top: 19, height: 3 }} />
            <span className="absolute text-[9px] text-red-500 font-semibold whitespace-nowrap"
              style={{ left: "50%", transform: "translateX(-50%)", top: 24 }}>
              ← {gapLabel}{unit} →
            </span>
          </>
        )}

        {/* 数值标注 */}
        <span className="absolute text-[9px] text-neutral-500" style={{ left: `${L(cm)}%`, top: 42 }}>{f(cm)}</span>
        <span className="absolute text-[9px] text-neutral-500" style={{ left: `${L(cM)}%`, top: 42, transform: "translateX(-100%)" }}>{f(cM)}</span>
      </div>

      {/* 底部说明 */}
      <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
        {status === "good" && hasOverlap && "✅ 你的需求在椅子可调范围内"}
        {status === "good" && !hasOverlap && "✅ 椅子尺寸偏大，不影响使用（宽了比窄了好）"}
        {status === "marginal" && hasOverlap && `⚠️ 基本覆盖，边缘区域需留意`}
        {status === "marginal" && !hasOverlap && `⚠️ 偏差${gapLabel}${unit}，勉强可用`}
        {status === "poor" && `❌ 偏差${gapLabel}${unit}，不建议选择`}
      </p>
    </div>
  );
}

function f(n: number): string { return n === Math.round(n) ? String(Math.round(n)) : n.toFixed(1); }
