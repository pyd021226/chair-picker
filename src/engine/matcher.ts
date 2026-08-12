// ============================================================
// 工学椅匹配引擎 — 打分、排序、生成匹配结果
// ============================================================

import type {
  Chair,
  ChairMatch,
  DimensionResult,
  DimensionKey,
  BodyDimensions,
  Range,
  FitStatus,
  WeightConfig,
} from "./types";
import {
  calculateBodyDimensions,
  computeCoverage,
  getEffectiveSeatWidth,
  scoreSeatHeight,
  scoreSeatDepth,
} from "./formulas";
import { DEFAULT_CONFIG, DEFAULT_MATCH_RULES, type FormulaConfig, type MatchRules } from "./config";

// ---- 默认权重 ----
// 核心尺寸权重高，功能/偏好维度权重低
const DEFAULT_WEIGHTS: WeightConfig = {
  seatHeight: 18,
  seatDepth: 16,
  seatWidth: 12,
  backHeight: 8,
  backWidth: 6,
  armrestHeight: 8,
  armrestWidth: 6,
  headrestRange: 6,
  headrestNeed: 2,
  reclineTension: 4,
  seatFirmness: 4,
  lumbarTension: 4,
  lumbarPosition: 4,
  lumbarDepth: 2,
};

// ---- 辅助 ----

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 将覆盖度转为 FitStatus */
function coverageToStatus(cov: number, rules?: MatchRules): FitStatus {
  const r = rules || DEFAULT_MATCH_RULES;
  if (cov >= r.goodThreshold) return "good";
  if (cov >= r.marginalThreshold) return "marginal";
  return "poor";
}

/** 数值型偏离度打分（用于分数型维度如后仰力度、坐垫软硬） */
function scoreByDeviation(
  userValue: number,
  chairValue: number | null,
  maxDeviation: number
): { coverage: number; explanation: string } {
  if (chairValue === null) {
    return { coverage: 0, explanation: "椅子数据缺失" };
  }
  const dev = Math.abs(userValue - chairValue);
  const coverage = clamp(1 - dev / maxDeviation, 0, 1);
  const status =
    coverage >= 0.9 ? "匹配"
    : coverage >= 0.7 ? "尚可"
    : "偏差较大";
  return {
    coverage,
    explanation: `用户理想${userValue}，椅子${chairValue}，偏差${dev.toFixed(1)}，${status}`,
  };
}

// ---- 维度评分函数 ----

interface ScoreContext {
  body: BodyDimensions;
  chair: Chair;
  cfg: FormulaConfig;
  rules: MatchRules;
}

function scoreSeatWidth(ctx: ScoreContext): DimensionResult {
  const userIdeal = ctx.body.seatWidth;
  const effectiveWidth = getEffectiveSeatWidth(ctx.chair, ctx.cfg);
  const chairRange: Range = effectiveWidth !== null
    ? { min: effectiveWidth, max: effectiveWidth }
    : { min: 0, max: 0 };
  const chairDataMissing = effectiveWidth === null;

  if (chairDataMissing) {
    return {
      key: "seatWidth",
      label: "坐宽",
      unit: "cm",
      userIdeal: { min: userIdeal, max: userIdeal },
      chairRange: { min: 0, max: 0 },
      coverage: 0.5,
      status: "marginal",
      explanation: "椅子坐宽数据缺失",
      priority: 3,
      chairDataMissing: true,
    };
  }

  // 坐宽是标量（椅子通常固定宽度）
  const coverage = clamp(effectiveWidth! / userIdeal, 0, 1);
  const diff = effectiveWidth! - userIdeal;
  const status = coverageToStatus(coverage, ctx.rules);
  const direction = diff > 0 ? `宽${diff.toFixed(0)}cm` : `窄${Math.abs(diff).toFixed(0)}cm`;

  return {
    key: "seatWidth",
    label: "坐宽",
    unit: "cm",
    userIdeal: { min: userIdeal, max: userIdeal },
    chairRange,
    coverage,
    status,
    explanation: `用户需要≥${userIdeal.toFixed(0)}cm（有效坐宽），椅子${effectiveWidth!.toFixed(0)}cm，${direction}`,
    priority: 3,
    chairDataMissing: false,
  };
}

function scoreBackHeight(ctx: ScoreContext): DimensionResult {
  const key: DimensionKey = "backHeight";
  const chairRange = ctx.chair.backHeight;
  if (!chairRange) return missingDim(key, "背高", "cm", 4, ctx);

  const userIdeal = ctx.body.backHeight;
  const coverage = computeCoverage(userIdeal, chairRange);
  const status = coverageToStatus(coverage, ctx.rules);
  const mid = (chairRange.min + chairRange.max) / 2;
  const idealMid = (userIdeal.min + userIdeal.max) / 2;
  const dir = mid > idealMid ? "偏高" : "偏低";

  return {
    key, label: "背高", unit: "cm",
    userIdeal, chairRange, coverage, status,
    explanation: `覆盖${(coverage * 100).toFixed(0)}%，${status === "good" ? "匹配" : dir}`,
    priority: 4, chairDataMissing: false,
  };
}

function scoreBackWidth(ctx: ScoreContext): DimensionResult {
  const key: DimensionKey = "backWidth";
  const chairVal = ctx.chair.backWidth;
  if (!chairVal) return missingScalar(key, "背宽", "cm", 5, ctx);

  const userVal = ctx.body.backWidth;
  const coverage = clamp(1 - Math.abs(userVal - chairVal) / 5, 0, 1);
  return {
    key, label: "背宽", unit: "cm",
    userIdeal: { min: userVal, max: userVal },
    chairRange: { min: chairVal, max: chairVal },
    coverage, status: coverageToStatus(coverage, ctx.rules),
    explanation: `用户需要${userVal}cm，椅子${chairVal}cm`,
    priority: 5, chairDataMissing: false,
  };
}

function scoreArmrestHeight(ctx: ScoreContext): DimensionResult {
  const key: DimensionKey = "armrestHeight";
  const chairRange = ctx.chair.armrestHeight;
  if (!chairRange) return missingDim(key, "扶手高", "cm", 6, ctx);

  const userIdeal = ctx.body.armrestHeight;
  const coverage = computeCoverage(userIdeal, chairRange);
  return {
    key, label: "扶手高", unit: "cm",
    userIdeal, chairRange, coverage,
    status: coverageToStatus(coverage, ctx.rules),
    explanation: `覆盖${(coverage * 100).toFixed(0)}%`,
    priority: 6, chairDataMissing: false,
  };
}

function scoreArmrestWidth(ctx: ScoreContext): DimensionResult {
  return scoreScalar(
    "armrestWidth", "扶手宽", "cm", 7, ctx,
    ctx.body.armrestWidth, ctx.chair.armrestWidth, 5
  );
}

function scoreHeadrestRange(ctx: ScoreContext): DimensionResult {
  const key: DimensionKey = "headrestRange";
  const chairRange = ctx.chair.headrestHeight;
  if (!chairRange) return missingDim(key, "头枕范围", "cm", 8, ctx);

  const userCenter = ctx.body.headrestCenter;
  const coverage = computeCoverage(
    { min: userCenter - 2, max: userCenter + 2 },
    chairRange
  );
  return {
    key, label: "头枕范围", unit: "cm",
    userIdeal: ctx.body.headrestRange,
    chairRange, coverage,
    status: coverageToStatus(coverage, ctx.rules),
    explanation: `头枕中心理想${userCenter}cm，椅子范围${chairRange.min}-${chairRange.max}cm`,
    priority: 8, chairDataMissing: false,
  };
}

function scoreHeadrestNeed(ctx: ScoreContext): DimensionResult {
  const key: DimensionKey = "headrestNeed";
  const needScore = ctx.body.headrestNeedScore;
  const hasHeadrest = ctx.chair.headrestFunc !== null && ctx.chair.headrestFunc !== "";
  const needLabel = needScore > 0.86 ? "强烈需要" : needScore > 0.43 ? "建议配置" : "可选";

  const coverage = hasHeadrest ? Math.min(1, needScore + 0.5) : Math.max(0, 1 - needScore);
  return {
    key, label: "头枕配置", unit: "需求指数",
    userIdeal: { min: needScore, max: needScore },
    chairRange: { min: hasHeadrest ? 1 : 0, max: hasHeadrest ? 1 : 0 },
    coverage,
    status: coverageToStatus(coverage, ctx.rules),
    explanation: `用户${needLabel}(指数${(needScore * 100).toFixed(0)}%)，椅子${hasHeadrest ? "有" : "无"}头枕`,
    priority: 9, chairDataMissing: false,
  };
}

function scoreReclineTension(ctx: ScoreContext): DimensionResult {
  const result = scoreByDeviation(ctx.body.reclineTension, 5, 5); // 椅子数据暂用中间值
  return {
    key: "reclineTension", label: "后仰力度", unit: "1-10级",
    userIdeal: { min: ctx.body.reclineTension, max: ctx.body.reclineTension },
    chairRange: { min: 5, max: 5 },
    ...result,
    status: coverageToStatus(result.coverage),
    priority: 10, chairDataMissing: false,
  };
}

function scoreSeatFirmness(ctx: ScoreContext): DimensionResult {
  const result = scoreByDeviation(ctx.body.seatFirmness, 5, 5);
  return {
    key: "seatFirmness", label: "坐垫软硬", unit: "1-10级",
    userIdeal: { min: ctx.body.seatFirmness, max: ctx.body.seatFirmness },
    chairRange: { min: 5, max: 5 },
    ...result,
    status: coverageToStatus(result.coverage),
    priority: 11, chairDataMissing: false,
  };
}

function scoreLumbarTension(ctx: ScoreContext): DimensionResult {
  const result = scoreByDeviation(ctx.body.lumbarTension, 5, 5);
  return {
    key: "lumbarTension", label: "腰撑力度", unit: "1-10级",
    userIdeal: { min: ctx.body.lumbarTension, max: ctx.body.lumbarTension },
    chairRange: { min: 5, max: 5 },
    ...result,
    status: coverageToStatus(result.coverage),
    priority: 12, chairDataMissing: false,
  };
}

function scoreLumbarPosition(ctx: ScoreContext): DimensionResult {
  const key: DimensionKey = "lumbarPosition";
  const chairLumbarH = ctx.chair.lumbarHeight;
  if (!chairLumbarH) return missingDim(key, "腰撑位置", "cm", 13, ctx);

  const userIdeal = ctx.body.lumbarPosition;
  const chairRange: Range = { min: chairLumbarH, max: chairLumbarH };
  const coverage = computeCoverage(userIdeal, chairRange);
  return {
    key, label: "腰撑位置", unit: "cm",
    userIdeal, chairRange, coverage,
    status: coverageToStatus(coverage, ctx.rules),
    explanation: `理想${(userIdeal.min + userIdeal.max) / 2}cm，椅子${chairLumbarH}cm`,
    priority: 13, chairDataMissing: false,
  };
}

function scoreLumbarDepth(ctx: ScoreContext): DimensionResult {
  return scoreScalar(
    "lumbarDepth", "腰撑深度", "cm", 14, ctx,
    ctx.body.lumbarDepth, ctx.chair.lumbarDepth, 1.5
  );
}

// ---- 辅助打分函数 ----

function missingDim(
  key: DimensionKey, label: string, unit: string, priority: number, ctx: ScoreContext
): DimensionResult {
  return {
    key, label, unit,
    userIdeal: { min: 0, max: 0 },
    chairRange: { min: 0, max: 0 },
    coverage: 0.5, // 缺失数据给中等分，不惩罚也不奖励
    status: "marginal",
    explanation: "此维度椅子数据暂缺，跳过评估",
    priority,
    chairDataMissing: true,
  };
}

function missingScalar(
  key: DimensionKey, label: string, unit: string, priority: number, ctx: ScoreContext
): DimensionResult {
  return missingDim(key, label, unit, priority, ctx);
}

function scoreScalar(
  key: DimensionKey, label: string, unit: string, priority: number,
  ctx: ScoreContext, userVal: number, chairVal: number | null, maxDev: number
): DimensionResult {
  if (chairVal === null) return missingScalar(key, label, unit, priority, ctx);
  const dev = Math.abs(userVal - chairVal);
  const coverage = clamp(1 - dev / maxDev, 0, 1);
  return {
    key, label, unit,
    userIdeal: { min: userVal, max: userVal },
    chairRange: { min: chairVal, max: chairVal },
    coverage, status: coverageToStatus(coverage, ctx.rules),
    explanation: `用户${userVal}，椅子${chairVal}，偏差${dev.toFixed(1)}${unit}`,
    priority, chairDataMissing: false,
  };
}

// ---- 主匹配函数 ----

/** 对单把椅子计算全部维度匹配结果 */
export function matchChair(
  chair: Chair,
  H: number,
  W: number,
  weights: WeightConfig = DEFAULT_WEIGHTS,
  cfg: FormulaConfig = DEFAULT_CONFIG,
  rules: MatchRules = DEFAULT_MATCH_RULES
): ChairMatch {
  const body = calculateBodyDimensions(H, W, cfg);
  const ctx: ScoreContext = { body, chair, cfg, rules };

  // 坐高 — 使用特殊评分规则
  const sh = (() => {
    const chairRange = chair.seatHeight;
    if (!chairRange) return missingDim("seatHeight", "坐高", "cm", 1, ctx);
    const result = scoreSeatHeight(body.seatHeight, chairRange);
    return {
      key: "seatHeight" as DimensionKey,
      label: "坐高",
      unit: "cm",
      userIdeal: body.seatHeight,
      chairRange,
      coverage: result.coverage,
      status: coverageToStatus(result.coverage),
      explanation: result.explanation,
      priority: 1,
      chairDataMissing: false,
    };
  })();

  // 坐深 — 椅子有效范围 = [坐深×2/3, 坐深]（人可前坐）
  const sd = (() => {
    const rawRange = chair.seatDepth;
    if (!rawRange) return missingDim("seatDepth", "坐深", "cm", 2, ctx);
    // 扩展为容纳范围：min×2/3 到 max
    const expandedRange: Range = {
      min: rawRange.min * (2 / 3),
      max: rawRange.max,
    };
    const result = scoreSeatDepth(body.seatDepth, expandedRange);
    return {
      key: "seatDepth" as DimensionKey,
      label: "坐深",
      unit: "cm",
      userIdeal: body.seatDepth,
      chairRange: expandedRange,
      coverage: result.coverage,
      status: coverageToStatus(result.coverage, ctx.rules),
      explanation: result.explanation,
      priority: 2,
      chairDataMissing: false,
    };
  })();

  const dimensions: DimensionResult[] = [
    sh,
    sd,
    scoreSeatWidth(ctx),
    scoreBackHeight(ctx),
    scoreBackWidth(ctx),
    scoreArmrestHeight(ctx),
    scoreArmrestWidth(ctx),
    scoreHeadrestRange(ctx),
    scoreHeadrestNeed(ctx),
    scoreReclineTension(ctx),
    scoreSeatFirmness(ctx),
    scoreLumbarTension(ctx),
    scoreLumbarPosition(ctx),
    scoreLumbarDepth(ctx),
  ];

  // 计算加权总分
  let totalWeight = 0;
  let weightedSum = 0;
  for (const dim of dimensions) {
    const w = weights[dim.key] ?? 0;
    weightedSum += dim.coverage * w;
    totalWeight += w;
  }

  const overallScore = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100)
    : 0;

  // 生成总结
  const goodDims = dimensions.filter(d => d.status === "good").length;
  const marginalDims = dimensions.filter(d => d.status === "marginal").length;
  const poorDims = dimensions.filter(d => d.status === "poor").length;
  const summary = `${goodDims}项匹配 / ${marginalDims}项尚可 / ${poorDims}项不匹配`;

  return { chair, overallScore, dimensions, summary };
}

/** 批量匹配所有椅子并排序。自动过滤缺少坐高+坐深核心数据的椅子。 */
export function matchAllChairs(
  chairs: Chair[],
  H: number,
  W: number,
  weights?: WeightConfig,
  cfg?: FormulaConfig,
  rules?: MatchRules
): ChairMatch[] {
  const validChairs = chairs.filter((c) => c.seatHeight !== null || c.seatDepth !== null);
  return validChairs
    .map((c) => matchChair(c, H, W, weights, cfg, rules))
    .sort((a, b) => b.overallScore - a.overallScore);
}
