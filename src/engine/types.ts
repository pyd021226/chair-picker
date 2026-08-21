// ============================================================
// 工学椅智能匹配 — 核心类型定义
// ============================================================

/** 数值范围（cm） */
export interface Range {
  min: number;
  max: number;
}

/** 匹配状态 */
export type FitStatus = "good" | "marginal" | "poor";

/** 单个维度的匹配结果 */
export interface DimensionResult {
  /** 维度标识 */
  key: DimensionKey;
  /** 维度中文名 */
  label: string;
  /** 单位 */
  unit: string;
  /** 用户理想范围 */
  userIdeal: Range;
  /** 椅子的实际范围（或固定值时 min===max） */
  chairRange: Range;
  /** 覆盖度 0-1 */
  coverage: number;
  /** 匹配状态 */
  status: FitStatus;
  /** 人类可读的解释 */
  explanation: string;
  /** 优先级（排序用，越小越重要） */
  priority: number;
  /** 椅子数据是否缺失此维度 */
  chairDataMissing: boolean;
}

/** 所有维度的 key */
export type DimensionKey =
  | "seatHeight"
  | "seatDepth"
  | "seatWidth"
  | "backHeight"
  | "backWidth"
  | "armrestHeight"
  | "armrestWidth"
  | "headrestRange"
  | "headrestNeed"
  | "reclineTension"
  | "seatFirmness"
  | "lumbarTension"
  | "lumbarPosition"
  | "lumbarDepth"
  | "capacity";

/** 用户身体尺寸估算结果 */
export interface BodyDimensions {
  seatHeight: Range;
  seatDepth: Range;
  seatWidth: Range;
  backHeight: Range;
  backWidth: number;
  armrestHeight: Range;
  armrestWidth: number;
  headrestCenter: number;
  headrestRange: Range;
  headrestNeedScore: number;
  reclineTension: number;
  seatFirmness: number;
  lumbarTension: number;
  lumbarPosition: Range;
  lumbarDepth: number;
  requiredCapacity: number; // kg, 需要的承重 = 体重 + 安全余量
}

/** 清洗后的椅子数据 */
export interface Chair {
  id: string;
  brand: string;
  name: string;
  sku: string | null;
  /** 椅子产品图片 URL（可选，支持本地 /chairs/ 路径或外部链接） */
  imageUrl: string | null;
  /** 三视图，暂缺则占位 */
  imageFront?: string | null;
  imageSide?: string | null;
  imageBack?: string | null;
  /** 购买链接，暂缺显示「暂无」 */
  purchaseUrl?: string | null;
  price: number | null;
  priceWithFootrest: number | null;
  surface: "mesh" | "sponge" | "leather" | "fabric" | null;

  seatHeight: Range | null;
  seatDepth: Range | null;
  seatWidth: number | null;
  seatWidthEffective: number | null;

  backHeight: Range | null;
  backWidth: number | null;
  lumbarWidth: number | null;
  lumbarHeight: number | null;
  lumbarFunc: string | null;
  lumbarDepth: number | null; // cm, 腰撑凸出深度
  lumbarAdjustable: boolean; // 腰撑位置是否可调

  armrestHeight: Range | null;
  armrestWidth: number | null; // 扶手内宽
  armrestFunc: string | null;

  headrestHeight: Range | null;
  headrestWidth: number | null;
  headrestFunc: string | null;
  headrestAdjustable: boolean;

  totalHeight: Range | null;
  reclineAngle: string | null;
  reclineTensionAdjustable: boolean; // 后仰力度是否可调
  baseType: string | null;
  gasCylinder: string | null;
  baseMaterial: string | null;
  maxWeight: number | null; // 最大承重 kg

  /** 归一化后的特征标签 */
  tags: string[];
}

/** 椅子匹配结果 */
export interface ChairMatch {
  chair: Chair;
  /** 综合匹配度 0-100 */
  overallScore: number;
  /** 各维度详细结果 */
  dimensions: DimensionResult[];
  /** 简短总结 */
  summary: string;
}

/** 用户输入 */
export interface UserInput {
  height: number; // cm
  weight: number; // kg
}

/** 维度权重配置 */
export type WeightConfig = Record<DimensionKey, number>;
