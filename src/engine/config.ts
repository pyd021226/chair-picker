// ============================================================
// 公式系数配置 — 所有可调参数集中管理
// 管理员面板可实时修改并持久化到 localStorage
// ============================================================

export interface FormulaConfig {
  // ...（公式系数同上）
  seatHeight: {
    coefLow: number; coefHigh: number;  // 矮个系数（<165cm）
    shoeLow: number; shoeHigh: number;
    cylinderLow: number; cylinderHigh: number;
    shortThreshold: number;         // 矮个阈值 165
    shortCoefLow: number; shortCoefHigh: number;  // 0.24~0.25
    midThreshold: number;           // 中等阈值 180
    midCoefLow: number; midCoefHigh: number;       // 0.25~0.26
    tallCoefLow: number; tallCoefHigh: number;     // 0.26~0.27 (>180cm)
  };
  seatDepth: {
    coefLow: number; coefHigh: number;
    postureMin: number; postureMax: number;
    gap: number;
    tallThreshold: number;
    tallCoefLow: number; tallCoefHigh: number;
    shortThreshold: number;
    shortCoefLow: number; shortCoefHigh: number;
    matchTwoThirdsRatio: number;
  };
  seatWidth: {
    intercept: number; coefH: number; coefW: number;
    activityLow: number; activityHigh: number;
    meshDeduction: number; spongeDeduction: number;
  };
  backHeight: {
    coefLow: number; coefHigh: number;
    tallThreshold: number;
    tallCoefLow: number; tallCoefHigh: number;
    shortThreshold: number;
    shortCoefLow: number; shortCoefHigh: number;
  };
  backWidth: {
    coef: number;
    weightThreshold: number;
    weightBonus: number;
  };
  armrestHeight: {
    coefLow: number; coefHigh: number;
    offset: number;
    tallThreshold: number;
    tallCoefLow: number; tallCoefHigh: number;
    shortThreshold: number;
    shortCoefLow: number; shortCoefHigh: number;
  };
  armrestWidth: {
    coefH: number; coefW: number; offset: number;
  };
  headrest: {
    coefCenter: number; coefLow: number; coefHigh: number;
    tallThreshold: number;
    tallCenter: number; tallLow: number; tallHigh: number;
    shortThreshold: number;
    shortCenter: number; shortLow: number; shortHigh: number;
    needBase: number; needDivisor: number;
  };
  reclineTension: {
    divisor: number;
    tallThreshold: number; tallWeightMultiplier: number;
    shortThreshold: number; shortWeightMultiplier: number;
  };
  seatFirmness: {
    base: number; divisor: number;
  };
  lumbarTension: {
    base: number; divisor: number; heightRef: number;
  };
  lumbarPosition: {
    coef: number; rangeHalf: number;
    tallThreshold: number; tallCoef: number;
    shortThreshold: number; shortCoef: number;
  };
  lumbarDepth: {
    base: number; weightThreshold: number; weightMultiplier: number;
  };
}

/** 匹配规则 — 控制打分逻辑的参数 */
export interface MatchRules {
  /** 评分等级阈值 */
  goodThreshold: number;    // ≥ 此值 → good（默认 0.90）
  marginalThreshold: number; // ≥ 此值 → marginal，否则 poor（默认 0.70）
  /** 无重叠时的最高覆盖度 */
  noOverlapMaxCoverage: number;  // 默认 0.65
  noOverlapPenaltyRate: number;  // 每单位间距的扣分率 默认 0.5
  /** 维度权重（总和不必为100，按比例分配） */
  weights: {
    seatHeight: number;
    seatDepth: number;
    seatWidth: number;
    backHeight: number;
    backWidth: number;
    armrestHeight: number;
    armrestWidth: number;
    headrestRange: number;
    headrestNeed: number;
    reclineTension: number;
    seatFirmness: number;
    lumbarTension: number;
    lumbarPosition: number;
    lumbarDepth: number;
    capacity: number;
  };
}

export const DEFAULT_MATCH_RULES: MatchRules = {
  goodThreshold: 0.90,
  marginalThreshold: 0.70,
  noOverlapMaxCoverage: 0.65,
  noOverlapPenaltyRate: 0.5,
  weights: {
    seatHeight: 18,
    seatDepth: 16,
    seatWidth: 12,
    backHeight: 8,
    backWidth: 6,
    armrestHeight: 0,
    armrestWidth: 6,
    headrestRange: 0,
    headrestNeed: 0,
    reclineTension: 0,
    seatFirmness: 0,
    lumbarTension: 0,
    lumbarPosition: 0,
    lumbarDepth: 0,
    capacity: 0,
  },
};

export const DEFAULT_CONFIG: FormulaConfig = {
  seatHeight: {
    coefLow: 0.24, coefHigh: 0.25,  // <165cm
    shoeLow: 2, shoeHigh: 5,
    cylinderLow: 2, cylinderHigh: 1,
    shortThreshold: 165,
    shortCoefLow: 0.24, shortCoefHigh: 0.25,
    midThreshold: 180,
    midCoefLow: 0.25, midCoefHigh: 0.26,
    tallCoefLow: 0.26, tallCoefHigh: 0.27,
  },
  seatDepth: {
    coefLow: 0.26, coefHigh: 0.29,
    postureMin: 0, postureMax: 8,
    gap: 2,
    tallThreshold: 185,
    tallCoefLow: 0.27, tallCoefHigh: 0.30,
    shortThreshold: 160,
    shortCoefLow: 0.25, shortCoefHigh: 0.27,
    matchTwoThirdsRatio: 2 / 3,
  },
  seatWidth: {
    intercept: -0.54, coefH: 1.52, coefW: 1.13,
    activityLow: 2, activityHigh: 4,
    meshDeduction: 5, spongeDeduction: 1,
  },
  backHeight: {
    coefLow: 0.355, coefHigh: 0.395,  // 0.375H ± 0.02，Sydor h7 = 0.50×0.75×H
    tallThreshold: 185,
    tallCoefLow: 0.355, tallCoefHigh: 0.395,
    shortThreshold: 155,
    shortCoefLow: 0.355, shortCoefHigh: 0.395,
  },
  backWidth: {
    coef: 0.23,  // Sydor b4 = 0.23H
    weightThreshold: 80,
    weightBonus: 0,
  },
  armrestHeight: {
    coefLow: 0.15, coefHigh: 0.17,
    offset: 1.5,
    tallThreshold: 185,
    tallCoefLow: 0.16, tallCoefHigh: 0.18,
    shortThreshold: 155,
    shortCoefLow: 0.15, shortCoefHigh: 0.16,
  },
  armrestWidth: {
    coefH: 0.27, coefW: 0, offset: 6,  // Sydor b5 = 0.27H + 6cm
  },
  headrest: {
    coefCenter: 0.44, coefLow: 0.39, coefHigh: 0.49,
    tallThreshold: 185,
    tallCenter: 0.46, tallLow: 0.41, tallHigh: 0.51,
    shortThreshold: 155,
    shortCenter: 0.42, shortLow: 0.38, shortHigh: 0.46,
    needBase: 155, needDivisor: 35,
  },
  reclineTension: {
    divisor: 1700,
    tallThreshold: 185, tallWeightMultiplier: 1.10,
    shortThreshold: 155, shortWeightMultiplier: 0.90,
  },
  seatFirmness: {
    base: 30, divisor: 8,
  },
  lumbarTension: {
    base: 30, divisor: 9, heightRef: 170,
  },
  lumbarPosition: {
    coef: 0.22, rangeHalf: 0.04,
    tallThreshold: 185, tallCoef: 0.24,
    shortThreshold: 155, shortCoef: 0.20,
  },
  lumbarDepth: {
    base: 2.0, weightThreshold: 60, weightMultiplier: 0.03,
  },
};

import { getSupabase } from "@/lib/supabase";

/** 从 Supabase 加载公式配置 */
export async function loadConfig(): Promise<FormulaConfig> {
  try {
    const { data, error } = await getSupabase().from("app_config").select("formula_config").eq("id", 1).single();
    if (error || !data || !data.formula_config) return DEFAULT_CONFIG;
    return deepMerge(DEFAULT_CONFIG, data.formula_config);
  } catch { return DEFAULT_CONFIG; }
}

/** 保存公式配置到 Supabase */
export async function saveConfig(config: FormulaConfig): Promise<void> {
  await getSupabase().from("app_config").upsert({ id: 1, formula_config: config });
}

/** 重置公式配置 */
export async function resetConfig(): Promise<void> {
  await getSupabase().from("app_config").upsert({ id: 1, formula_config: DEFAULT_CONFIG });
}

/** 导出配置为 JSON 文件下载 */
export function exportConfig(config: FormulaConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chair-picker-config.json";
  a.click();
  URL.revokeObjectURL(url);
}

function deepMerge<T extends Record<string, any>>(base: T, overlay: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(overlay) as (keyof T)[]) {
    if (overlay[key] !== undefined && typeof overlay[key] === "object" && !Array.isArray(overlay[key])) {
      result[key] = deepMerge(base[key] as any, overlay[key] as any);
    } else if (overlay[key] !== undefined) {
      result[key] = overlay[key] as any;
    }
  }
  return result;
}

/** 加载匹配规则 */
export async function loadMatchRules(): Promise<MatchRules> {
  try {
    const { data, error } = await getSupabase().from("app_config").select("match_rules").eq("id", 1).single();
    if (error || !data || !data.match_rules) return DEFAULT_MATCH_RULES;
    return { ...DEFAULT_MATCH_RULES, ...data.match_rules };
  } catch { return DEFAULT_MATCH_RULES; }
}

/** 保存匹配规则 */
export async function saveMatchRules(rules: MatchRules): Promise<void> {
  await getSupabase().from("app_config").upsert({ id: 1, match_rules: rules });
}

/** 重置匹配规则 */
export async function resetMatchRules(): Promise<void> {
  await getSupabase().from("app_config").upsert({ id: 1, match_rules: DEFAULT_MATCH_RULES });
}
