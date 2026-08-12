// ============================================================
// 人体尺寸估算公式引擎（可配置版本）
// 从 config.ts 读取系数，管理员面板可实时调整
// ============================================================

import type { BodyDimensions, Range } from "./types";
import { DEFAULT_CONFIG, loadConfig, type FormulaConfig } from "./config";

// ---- 辅助函数 ----

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function r(min: number, max: number): Range {
  return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 };
}

// ---- 可配置版本的计算 ----

export function calculateBodyDimensions(
  H: number, W: number, cfg?: FormulaConfig
): BodyDimensions {
  const c = cfg || DEFAULT_CONFIG;

  return {
    seatHeight: calcSeatHeight(H, c),
    seatDepth: calcSeatDepth(H, c),
    seatWidth: calcSeatWidth(H, W, c),
    backHeight: calcBackHeight(H, c),
    backWidth: calcBackWidth(H, W, c),
    armrestHeight: calcArmrestHeight(H, c),
    armrestWidth: calcArmrestWidth(H, W, c),
    headrestCenter: calcHeadrestCenter(H, c),
    headrestRange: calcHeadrestRange(H, c),
    headrestNeedScore: clamp((H - c.headrest.needBase) / c.headrest.needDivisor, 0, 1),
    reclineTension: calcReclineTension(H, W, c),
    seatFirmness: calcSeatFirmness(H, W, c),
    lumbarTension: calcLumbarTension(H, W, c),
    lumbarPosition: calcLumbarPosition(H, c),
    lumbarDepth: calcLumbarDepth(W, c),
  };
}

function calcSeatHeight(H: number, c: FormulaConfig): Range {
  const s = c.seatHeight;
  let cl = s.coefLow, ch = s.coefHigh;
  if (H > s.midThreshold) { cl = s.tallCoefLow; ch = s.tallCoefHigh; }        // >180
  else if (H > s.shortThreshold) { cl = s.midCoefLow; ch = s.midCoefHigh; }   // 165-180
  // else: <165, use default coefLow/coefHigh
  return r(H * cl + s.shoeLow, H * ch + s.shoeHigh - s.cylinderHigh);
}

function calcSeatDepth(H: number, c: FormulaConfig): Range {
  const { seatDepth: s } = c;
  let cl = s.coefLow, ch = s.coefHigh;
  if (H > s.tallThreshold) { cl = s.tallCoefLow; ch = s.tallCoefHigh; }
  else if (H < s.shortThreshold) { cl = s.shortCoefLow; ch = s.shortCoefHigh; }
  return r(H * cl - s.postureMax - s.gap, H * ch - s.postureMin - s.gap);
}

function calcSeatWidth(H: number, W: number, c: FormulaConfig): Range {
  const { seatWidth: s } = c;
  const B_cm = (s.intercept + s.coefH * H + s.coefW * W) / 10; // 臀宽 cm
  return r(0, B_cm + s.activityHigh); // 范围从0到最大需求
}

function calcBackHeight(H: number, c: FormulaConfig): Range {
  const { backHeight: b } = c;
  if (H > b.tallThreshold) return r(H * b.tallCoefLow, H * b.tallCoefHigh);
  if (H < b.shortThreshold) return r(H * b.shortCoefLow, H * b.shortCoefHigh);
  return r(H * b.coefLow, H * b.coefHigh);
}

function calcBackWidth(H: number, W: number, c: FormulaConfig): number {
  const { backWidth: b } = c;
  const base = H * b.coef;
  const bonus = Math.max(0, (W - b.weightThreshold) * b.weightBonus);
  return Math.round((base + bonus) * 10) / 10;
}

function calcArmrestHeight(H: number, c: FormulaConfig): Range {
  const { armrestHeight: a } = c;
  if (H > a.tallThreshold) return r(H * a.tallCoefLow + a.offset, H * a.tallCoefHigh + a.offset);
  if (H < a.shortThreshold) return r(H * a.shortCoefLow + a.offset, H * a.shortCoefHigh + a.offset);
  return r(H * a.coefLow + a.offset, H * a.coefHigh + a.offset);
}

function calcArmrestWidth(H: number, W: number, c: FormulaConfig): number {
  const { armrestWidth: a } = c;
  return Math.round((a.coefH * H + a.coefW * W + a.offset) * 10) / 10;
}

function calcHeadrestCenter(H: number, c: FormulaConfig): number {
  const h = c.headrest;
  if (H > h.tallThreshold) return Math.round(H * h.tallCenter * 10) / 10;
  if (H < h.shortThreshold) return Math.round(H * h.shortCenter * 10) / 10;
  return Math.round(H * h.coefCenter * 10) / 10;
}

function calcHeadrestRange(H: number, c: FormulaConfig): Range {
  const h = c.headrest;
  if (H > h.tallThreshold) return r(H * h.tallLow, H * h.tallHigh);
  if (H < h.shortThreshold) return r(H * h.shortLow, H * h.shortHigh);
  return r(H * h.coefLow, H * h.coefHigh);
}

function calcReclineTension(H: number, W: number, c: FormulaConfig): number {
  const t = c.reclineTension;
  let effW = W;
  if (H > t.tallThreshold) effW = W * t.tallWeightMultiplier;
  else if (H < t.shortThreshold) effW = W * t.shortWeightMultiplier;
  return Math.round(clamp((effW * H) / t.divisor, 1, 10) * 10) / 10;
}

function calcSeatFirmness(H: number, W: number, c: FormulaConfig): number {
  const f = c.seatFirmness;
  const base = (W - f.base) / f.divisor;
  const correction = Math.pow(170 / H, 0.5);
  return Math.round(clamp(base * correction, 1, 10) * 10) / 10;
}

function calcLumbarTension(H: number, W: number, c: FormulaConfig): number {
  const l = c.lumbarTension;
  const base = (W - l.base) / l.divisor;
  const correction = H / l.heightRef;
  return Math.round(clamp(base * correction, 1, 10) * 10) / 10;
}

function calcLumbarPosition(H: number, c: FormulaConfig): Range {
  const l = c.lumbarPosition;
  let cf = l.coef;
  if (H > l.tallThreshold) cf = l.tallCoef;
  else if (H < l.shortThreshold) cf = l.shortCoef;
  return r(H * (cf - l.rangeHalf), H * (cf + l.rangeHalf));
}

function calcLumbarDepth(W: number, c: FormulaConfig): number {
  const l = c.lumbarDepth;
  return Math.round((l.base + Math.max(0, (W - l.weightThreshold) * l.weightMultiplier)) * 10) / 10;
}

// ---- 兼容旧接口 ----

export function computeCoverage(userRange: Range, chairRange: Range): number {
  // 无交集：根据距离和用户范围的比例扣分
  if (chairRange.min > userRange.max || chairRange.max < userRange.min) {
    const gap = chairRange.min > userRange.max
      ? chairRange.min - userRange.max
      : userRange.min - chairRange.max;
    const userSpan = userRange.max - userRange.min || 1;
    // gap 相对于用户范围的比例：gap 越大，覆盖度越低
    // 只有 gap 非常小（<10% 用户范围）时才给"尚可"
    const ratio = gap / userSpan;
    return Math.max(0, Math.min(0.65, 0.65 - ratio * 0.5));
  }
  const overlapMin = Math.max(userRange.min, chairRange.min);
  const overlapMax = Math.min(userRange.max, chairRange.max);
  const userSpan = userRange.max - userRange.min;
  if (userSpan === 0) return 1;
  return clamp((overlapMax - overlapMin) / userSpan, 0, 1);
}

export function getEffectiveSeatWidth(chair: {
  seatWidth: number | null; surface: string | null;
}, cfg?: FormulaConfig): number | null {
  const c = cfg || DEFAULT_CONFIG;
  if (chair.seatWidth === null) return null;
  const nominal = chair.seatWidth;
  if (chair.surface === "mesh") return nominal - c.seatWidth.meshDeduction;
  if (chair.surface === "sponge") return nominal - c.seatWidth.spongeDeduction;
  return nominal;
}

export function scoreSeatHeight(userIdeal: Range, chairRange: Range): { coverage: number; explanation: string } {
  const coverage = computeCoverage(userIdeal, chairRange);
  const status = coverage >= 1 ? "量身定做" : coverage >= 0.9 ? "合适" : coverage >= 0.7 ? "一般" : "不合适";
  const midUser = (userIdeal.min + userIdeal.max) / 2;
  const midChair = (chairRange.min + chairRange.max) / 2;
  const diff = midChair - midUser;
  const direction = diff > 1 ? `偏长约${diff.toFixed(0)}cm` : diff < -1 ? `偏短约${Math.abs(diff).toFixed(0)}cm` : "";
  return { coverage, explanation: `覆盖度${(coverage * 100).toFixed(0)}%，${status}${direction ? "，" + direction : ""}` };
}

export function scoreSeatDepth(userIdeal: Range, chairRange: Range): { coverage: number; explanation: string } {
  // chairRange 已经是 [坐深×2/3, 坐深] 扩展后的容纳范围
  const coverage = computeCoverage(userIdeal, chairRange);
  const status = coverage >= 1 ? "量身定做" : coverage >= 0.9 ? "合适" : coverage >= 0.7 ? "一般" : "不合适";
  const midU = (userIdeal.min + userIdeal.max) / 2;
  const midC = (chairRange.min + chairRange.max) / 2;
  const d = midC - midU;
  const dir = d > 1 ? `偏短${d.toFixed(0)}cm` : d < -1 ? `偏长${Math.abs(d).toFixed(0)}cm` : "";
  return { coverage, explanation: `容纳${chairRange.min.toFixed(0)}-${chairRange.max.toFixed(0)}cm，${(coverage*100).toFixed(0)}%，${status}${dir?"，"+dir:""}` };
}
