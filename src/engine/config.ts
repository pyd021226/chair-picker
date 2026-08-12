// ============================================================
// 公式系数配置 — 所有可调参数集中管理
// 管理员面板可实时修改并持久化到 localStorage
// ============================================================

export interface FormulaConfig {
  // 坐高 (Seat Height)
  seatHeight: {
    coefLow: number;    // 默认 0.235
    coefHigh: number;   // 默认 0.255
    shoeLow: number;    // 鞋底最低 cm
    shoeHigh: number;   // 鞋底最高 cm
    cylinderLow: number;  // 气杆最大压缩 cm
    cylinderHigh: number; // 气杆最小压缩 cm
    tallThreshold: number;  // 身高阈值 cm
    tallCoefLow: number;
    tallCoefHigh: number;
  };
  // 坐深 (Seat Depth)
  seatDepth: {
    coefLow: number;
    coefHigh: number;
    postureMin: number;  // 最小姿势调整 cm
    postureMax: number;  // 最大姿势调整 cm
    gap: number;         // 膝盖窝间距 cm
    tallThreshold: number;
    tallCoefLow: number;
    tallCoefHigh: number;
    shortThreshold: number;
    shortCoefLow: number;
    shortCoefHigh: number;
    matchTwoThirdsRatio: number; // 2/3 边界比例
  };
  // 坐宽 (Seat Width)
  seatWidth: {
    intercept: number;   // 回归截距 mm
    coefH: number;       // 身高系数
    coefW: number;       // 体重系数
    activityLow: number; // 最小活动空间 cm
    activityHigh: number;// 最大活动空间 cm
    meshDeduction: number;   // 网布椅扣减 cm
    spongeDeduction: number; // 海绵椅扣减 cm
  };
  // 背高 (Back Height)
  backHeight: {
    coefLow: number;
    coefHigh: number;
    tallThreshold: number;
    tallCoefLow: number;
    tallCoefHigh: number;
    shortThreshold: number;
    shortCoefLow: number;
    shortCoefHigh: number;
  };
  // 背宽 (Back Width)
  backWidth: {
    coef: number;
    weightThreshold: number;
    weightBonus: number;
  };
  // 扶手高 (Armrest Height)
  armrestHeight: {
    coefLow: number;
    coefHigh: number;
    offset: number;
    tallThreshold: number;
    tallCoefLow: number;
    tallCoefHigh: number;
    shortThreshold: number;
    shortCoefLow: number;
    shortCoefHigh: number;
  };
  // 扶手宽 (Armrest Width)
  armrestWidth: {
    coefH: number;
    coefW: number;
    offset: number;
  };
  // 头枕 (Headrest)
  headrest: {
    coefCenter: number;
    coefLow: number;
    coefHigh: number;
    tallThreshold: number;
    tallCenter: number;
    tallLow: number;
    tallHigh: number;
    shortThreshold: number;
    shortCenter: number;
    shortLow: number;
    shortHigh: number;
    needBase: number;     // 需求公式基准 cm
    needDivisor: number;  // 需求公式除数
  };
  // 后仰力度 (Recline Tension)
  reclineTension: {
    divisor: number;
    tallThreshold: number;
    tallWeightMultiplier: number;
    shortThreshold: number;
    shortWeightMultiplier: number;
  };
  // 坐垫软硬 (Seat Firmness)
  seatFirmness: {
    base: number;
    divisor: number;
  };
  // 腰撑力度 (Lumbar Tension)
  lumbarTension: {
    base: number;
    divisor: number;
    heightRef: number;
  };
  // 腰撑位置 (Lumbar Position)
  lumbarPosition: {
    coef: number;
    rangeHalf: number;
    tallThreshold: number;
    tallCoef: number;
    shortThreshold: number;
    shortCoef: number;
  };
  // 腰撑深度 (Lumbar Depth)
  lumbarDepth: {
    base: number;
    weightThreshold: number;
    weightMultiplier: number;
  };
}

export const DEFAULT_CONFIG: FormulaConfig = {
  seatHeight: {
    coefLow: 0.235, coefHigh: 0.255,
    shoeLow: 2, shoeHigh: 5,
    cylinderLow: 2, cylinderHigh: 1,
    tallThreshold: 185,
    tallCoefLow: 0.25, tallCoefHigh: 0.27,
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
    coefLow: 0.33, coefHigh: 0.37,
    tallThreshold: 185,
    tallCoefLow: 0.36, tallCoefHigh: 0.38,
    shortThreshold: 155,
    shortCoefLow: 0.32, shortCoefHigh: 0.34,
  },
  backWidth: {
    coef: 0.22,
    weightThreshold: 80,
    weightBonus: 0.03,
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
    coefH: 0.152, coefW: 0.113, offset: 4.95,
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

const STORAGE_KEY = "chair-picker-formula-config";

/** 从 localStorage 加载用户修改过的配置 */
export function loadConfig(): FormulaConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const saved = JSON.parse(raw);
    return deepMerge(DEFAULT_CONFIG, saved);
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** 保存配置到 localStorage */
export function saveConfig(config: FormulaConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** 重置为默认配置 */
export function resetConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
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
