// ============================================================
// 人体尺寸估算公式引擎
// 所有公式基于 GB10000-88 中国成年人人体尺寸标准推导
// 输入：身高 H(cm)，体重 W(kg)
// ============================================================

import type { BodyDimensions, Range } from "./types";

// ---- 辅助函数 ----

/** 将值限制在范围内 */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 创建范围对象 */
function range(min: number, max: number): Range {
  return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 };
}

/** 计算两个范围的覆盖度 (0-1) */
export function computeCoverage(userRange: Range, chairRange: Range): number {
  if (chairRange.min > userRange.max || chairRange.max < userRange.min) {
    // 无交集 → 计算距离衰减
    const gap =
      chairRange.min > userRange.max
        ? chairRange.min - userRange.max
        : userRange.min - chairRange.max;
    return Math.max(0, 1 - gap / userRange.max);
  }
  const overlapMin = Math.max(userRange.min, chairRange.min);
  const overlapMax = Math.min(userRange.max, chairRange.max);
  const userSpan = userRange.max - userRange.min;
  if (userSpan === 0) return 1;
  return clamp((overlapMax - overlapMin) / userSpan, 0, 1);
}

// ---- 1. 坐高 (Seat Height) ----
// 公式：H × (0.235~0.255) + 2~5(鞋底) - 1~2(气杆压缩)
// H > 185cm: 系数变为 0.25~0.27

function calcSeatHeight(H: number): Range {
  let coefLow = 0.235;
  let coefHigh = 0.255;
  if (H > 185) {
    coefLow = 0.25;
    coefHigh = 0.27;
  }
  // min: 低系数 + 最低鞋底(2) - 最大气杆压缩(2)
  // max: 高系数 + 最高鞋底(5) - 最小气杆压缩(1)
  const min = H * coefLow + 2 - 2;
  const max = H * coefHigh + 5 - 1;
  return range(min, max);
}

/** 坐高匹配规则（特殊：标量值范围对比） */
export function scoreSeatHeight(
  userIdeal: Range,
  chairRange: Range
): { coverage: number; explanation: string } {
  const coverage = computeCoverage(userIdeal, chairRange);
  const status =
    coverage >= 1 ? "量身定做"
    : coverage >= 0.9 ? "合适"
    : coverage >= 0.7 ? "一般"
    : "不合适";

  const midUser = (userIdeal.min + userIdeal.max) / 2;
  const midChair = (chairRange.min + chairRange.max) / 2;
  const diff = midChair - midUser;
  const direction =
    diff > 1 ? `偏长约${diff.toFixed(0)}cm`
    : diff < -1 ? `偏短约${Math.abs(diff).toFixed(0)}cm`
    : "";

  return {
    coverage,
    explanation: `覆盖度${(coverage * 100).toFixed(0)}%，${status}${direction ? "，" + direction : ""}`,
  };
}

// ---- 2. 坐深 (Seat Depth) ----
// 公式：H × (0.26~0.29) - 0~8(姿势调整) - 2(黄金间距)
// H > 185: 0.27~0.30; H < 160: 0.25~0.27

function calcSeatDepth(H: number): Range {
  let coefLow = 0.26;
  let coefHigh = 0.29;
  if (H > 185) {
    coefLow = 0.27;
    coefHigh = 0.3;
  } else if (H < 160) {
    coefLow = 0.25;
    coefHigh = 0.27;
  }
  // min: 低系数 - 最大姿势调整(8) - 间距(2)
  // max: 高系数 - 最小姿势调整(0) - 间距(2)
  const min = H * coefLow - 8 - 2;
  const max = H * coefHigh - 0 - 2;
  return range(min, max);
}

/** 坐深匹配规则：用户上界≤椅子max，用户下界≥椅子min + (max-min)×2/3 */
export function scoreSeatDepth(
  userIdeal: Range,
  chairRange: Range
): { coverage: number; explanation: string } {
  const twoThirdsPos = chairRange.min + (chairRange.max - chairRange.min) * (2 / 3);

  const upperOk = userIdeal.max <= chairRange.max;
  const lowerOk = userIdeal.min >= twoThirdsPos;

  if (upperOk && lowerOk) {
    return { coverage: 1, explanation: "完全匹配，坐深范围理想" };
  }

  let coverage = 1;
  const issues: string[] = [];

  if (!upperOk) {
    const excess = userIdeal.max - chairRange.max;
    coverage -= clamp(excess / 5, 0, 0.5);
    issues.push(`偏长约${excess.toFixed(0)}cm`);
  }
  if (!lowerOk) {
    const shortage = twoThirdsPos - userIdeal.min;
    coverage -= clamp(shortage / 5, 0, 0.5);
    issues.push(`偏短约${shortage.toFixed(0)}cm`);
  }

  coverage = clamp(coverage, 0, 1);
  const status = coverage >= 0.9 ? "合适" : coverage >= 0.7 ? "一般" : "不合适";

  return {
    coverage,
    explanation: `覆盖度${(coverage * 100).toFixed(0)}%，${status}，${issues.join("，")}`,
  };
}

// ---- 3. 坐宽 (Seat Width) ----
// 公式：B(mm) = -0.54 + 1.52H + 1.13W
// 坐宽需求 = B/10 + 2~4(活动空间) cm
// 网布椅有效坐宽 = 标称坐宽 - 4~6cm; 海绵椅 -0~2cm

function calcSeatWidth(H: number, W: number): number {
  const B_mm = -0.54 + 1.52 * H + 1.13 * W; // 单位 mm
  const B_cm = B_mm / 10; // 转为 cm
  const activitySpace = 4; // 取中间值 4cm 活动空间
  return Math.round((B_cm + activitySpace) * 10) / 10;
}

/** 获取椅子的有效坐宽 */
export function getEffectiveSeatWidth(chair: {
  seatWidth: number | null;
  surface: string | null;
}): number | null {
  if (chair.seatWidth === null) return null;
  const nominal = chair.seatWidth;
  const surface = chair.surface;
  if (surface === "mesh") return nominal - 5; // 网布 -4~6，取中值 5
  if (surface === "sponge") return nominal - 1; // 海绵 -0~2，取中值 1
  return nominal; // 未知材质不扣减
}

// ---- 4. 背高 (Back Height) ----
// H × (0.33~0.37)，标准 0.35
// H > 185: 0.36~0.38; H < 155: 0.32~0.34

function calcBackHeight(H: number): Range {
  let coefLow = 0.33;
  let coefHigh = 0.37;
  if (H > 185) { coefLow = 0.36; coefHigh = 0.38; }
  else if (H < 155) { coefLow = 0.32; coefHigh = 0.34; }
  return range(H * coefLow, H * coefHigh);
}

// ---- 5. 背宽 (Back Width) ----
// H × 0.22 + max(0, (W-80) × 0.03)
// 范围 H × (0.20~0.25)

function calcBackWidth(H: number, W: number): number {
  const base = H * 0.22;
  const weightBonus = Math.max(0, (W - 80) * 0.03);
  return Math.round((base + weightBonus) * 10) / 10;
}

// ---- 6. 扶手高 (Armrest Height) ----
// H × 0.16 + 1.5
// H > 185: 0.16~0.18; H < 155: 0.15~0.16

function calcArmrestHeight(H: number): Range {
  let coefLow = 0.15;
  let coefHigh = 0.17;
  let offset = 1.5;
  if (H > 185) { coefLow = 0.16; coefHigh = 0.18; offset = 1.5; }
  else if (H < 155) { coefLow = 0.15; coefHigh = 0.16; offset = 1.5; }
  return range(H * coefLow + offset, H * coefHigh + offset);
}

// ---- 7. 扶手宽 (Armrest Inner Width) ----
// 扶手内宽 = 0.152H + 0.113W + 4.95

function calcArmrestWidth(H: number, W: number): number {
  return Math.round((0.152 * H + 0.113 * W + 4.95) * 10) / 10;
}

// ---- 8. 头枕范围 (Headrest Range) ----
// 中心 = H × 0.44; 范围 = H × (0.39~0.49)
// H > 185: 中心 0.46; H < 155: 中心 0.42

function calcHeadrestRange(H: number): { center: number; range: Range } {
  let center = H * 0.44;
  let low = H * 0.39;
  let high = H * 0.49;
  if (H > 185) { center = H * 0.46; low = H * 0.41; high = H * 0.51; }
  else if (H < 155) { center = H * 0.42; low = H * 0.38; high = H * 0.46; }
  return { center: Math.round(center * 10) / 10, range: range(low, high) };
}

// ---- 9. 头枕需求评分 (Headrest Need) ----
// (H - 155) / 35, 限制 [0, 1]
// >0.86 强烈需要; 0.43-0.86 建议; 0-0.43 可选; <0 不需要

function calcHeadrestNeed(H: number): number {
  return clamp((H - 155) / 35, 0, 1);
}

// ---- 10. 后仰力度 (Recline Tension) ----
// min(10, W × H / 1700)
// H > 185: 有效体重×1.10; H < 155: 有效体重×0.90

function calcReclineTension(H: number, W: number): number {
  let effectiveW = W;
  if (H > 185) effectiveW = W * 1.1;
  else if (H < 155) effectiveW = W * 0.9;
  return Math.round(clamp((effectiveW * H) / 1700, 1, 10) * 10) / 10;
}

// ---- 11. 坐垫软硬 (Seat Firmness) ----
// clamp((W - 30) / 8, 1, 10)
// 身高修正：(170/H)^0.5（极端身高用户）

function calcSeatFirmness(H: number, W: number): number {
  const base = (W - 30) / 8;
  const heightCorrection = Math.pow(170 / H, 0.5);
  return Math.round(clamp(base * heightCorrection, 1, 10) * 10) / 10;
}

// ---- 12. 腰撑力度 (Lumbar Tension) ----
// clamp((W - 30) / 9, 1, 10) × (H/170)

function calcLumbarTension(H: number, W: number): number {
  const base = (W - 30) / 9;
  const heightCorrection = H / 170;
  return Math.round(clamp(base * heightCorrection, 1, 10) * 10) / 10;
}

// ---- 13a. 腰撑位置 (Lumbar Position) ----
// H × 0.22; H > 185: 0.24; H < 155: 0.20

function calcLumbarPosition(H: number): Range {
  let coef = 0.22;
  if (H > 185) coef = 0.24;
  else if (H < 155) coef = 0.2;
  return range(H * (coef - 0.04), H * (coef + 0.04));
}

// ---- 13b. 腰撑深度 (Lumbar Depth) ----
// 2.0 + max(0, (W - 60) × 0.03)

function calcLumbarDepth(W: number): number {
  return Math.round((2.0 + Math.max(0, (W - 60) * 0.03)) * 10) / 10;
}

// ============================================================
// 主入口：计算用户全部身体尺寸
// ============================================================

export function calculateBodyDimensions(H: number, W: number): BodyDimensions {
  const headrest = calcHeadrestRange(H);
  return {
    seatHeight: calcSeatHeight(H),
    seatDepth: calcSeatDepth(H),
    seatWidth: calcSeatWidth(H, W),
    backHeight: calcBackHeight(H),
    backWidth: calcBackWidth(H, W),
    armrestHeight: calcArmrestHeight(H),
    armrestWidth: calcArmrestWidth(H, W),
    headrestCenter: headrest.center,
    headrestRange: headrest.range,
    headrestNeedScore: calcHeadrestNeed(H),
    reclineTension: calcReclineTension(H, W),
    seatFirmness: calcSeatFirmness(H, W),
    lumbarTension: calcLumbarTension(H, W),
    lumbarPosition: calcLumbarPosition(H),
    lumbarDepth: calcLumbarDepth(W),
  };
}

/** 获取维度对应的用户理想范围（用于匹配） */
export function getUserIdealRange(
  body: BodyDimensions,
  key: string
): Range | number | null {
  switch (key) {
    case "seatHeight": return body.seatHeight;
    case "seatDepth": return body.seatDepth;
    case "seatWidth": return body.seatWidth;
    case "backHeight": return body.backHeight;
    case "backWidth": return body.backWidth;
    case "armrestHeight": return body.armrestHeight;
    case "armrestWidth": return body.armrestWidth;
    case "headrestRange": return body.headrestRange;
    case "headrestNeed": return body.headrestNeedScore;
    case "reclineTension": return body.reclineTension;
    case "seatFirmness": return body.seatFirmness;
    case "lumbarTension": return body.lumbarTension;
    case "lumbarPosition": return body.lumbarPosition;
    case "lumbarDepth": return body.lumbarDepth;
    default: return null;
  }
}
