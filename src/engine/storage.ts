// ============================================================
// 使用数据收集 + 自定义椅子管理
// 所有数据存储在 localStorage，纯前端方案
// ============================================================

import type { Chair } from "./types";

// ---- 用户提交记录 ----

export interface UsageRecord {
  timestamp: number;
  nickname: string;
  gender: "male" | "female" | null;
  height: number;
  weight: number;
  sitLong: boolean;
  budgetMin: number;
  budgetMax: number;
}

const USAGE_KEY = "chair-picker-usage";

/** 记录一次用户提交 */
export function recordUsage(data: Omit<UsageRecord, "timestamp">): void {
  if (typeof window === "undefined") return;
  const records = getUsageRecords();
  records.push({ ...data, timestamp: Date.now() });
  // 只保留最近 500 条
  if (records.length > 500) records.splice(0, records.length - 500);
  localStorage.setItem(USAGE_KEY, JSON.stringify(records));
}

/** 获取所有使用记录 */
export function getUsageRecords(): UsageRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** 清空使用记录 */
export function clearUsageRecords(): void {
  localStorage.removeItem(USAGE_KEY);
}

// ---- 使用统计 ----

export interface UsageStats {
  total: number;
  gender: { male: number; female: number; unknown: number };
  heightDist: { label: string; count: number }[];  // 每5cm一组
  weightDist: { label: string; count: number }[];  // 每5kg一组
  sitLongPct: number;   // 久坐比例
  budgetAvg: number;    // 平均预算
  topHeights: { value: number; count: number }[];
}

export function getUsageStats(): UsageStats {
  const records = getUsageRecords();
  const total = records.length;

  const gender = { male: 0, female: 0, unknown: 0 };
  const heightMap: Record<string, number> = {};
  const weightMap: Record<string, number> = {};
  let sitLongCount = 0;
  let budgetSum = 0;
  let budgetCount = 0;

  for (const r of records) {
    if (r.gender === "male") gender.male++;
    else if (r.gender === "female") gender.female++;
    else gender.unknown++;

    const hBucket = Math.floor(r.height / 5) * 5;
    const hKey = `${hBucket}-${hBucket + 4}`;
    heightMap[hKey] = (heightMap[hKey] || 0) + 1;

    const wBucket = Math.floor(r.weight / 5) * 5;
    const wKey = `${wBucket}-${wBucket + 4}`;
    weightMap[wKey] = (weightMap[wKey] || 0) + 1;

    if (r.sitLong) sitLongCount++;
    if (r.budgetMax > 0) { budgetSum += (r.budgetMin + r.budgetMax) / 2; budgetCount++; }
  }

  const heightDist = Object.entries(heightMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));

  const weightDist = Object.entries(weightMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));

  const topHeights = Object.entries(
    records.reduce((acc, r) => { acc[r.height] = (acc[r.height] || 0) + 1; return acc; }, {} as Record<number, number>)
  ).map(([v, c]) => ({ value: parseInt(v), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total,
    gender,
    heightDist,
    weightDist,
    sitLongPct: total > 0 ? Math.round((sitLongCount / total) * 100) : 0,
    budgetAvg: budgetCount > 0 ? Math.round(budgetSum / budgetCount) : 0,
    topHeights,
  };
}

// ---- 自定义椅子管理 ----

const CUSTOM_CHAIRS_KEY = "chair-picker-custom-chairs";

/** 加载用户添加的自定义椅子 */
export function loadCustomChairs(): Chair[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CHAIRS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** 保存自定义椅子 */
export function saveCustomChairs(chairs: Chair[]): void {
  localStorage.setItem(CUSTOM_CHAIRS_KEY, JSON.stringify(chairs));
}

/** 添加一把自定义椅子 */
export function addCustomChair(chair: Chair): void {
  const chairs = loadCustomChairs();
  chairs.push(chair);
  saveCustomChairs(chairs);
}

/** 删除自定义椅子 */
export function removeCustomChair(id: string): void {
  const chairs = loadCustomChairs().filter(c => c.id !== id);
  saveCustomChairs(chairs);
}

// ---- 内置椅子数据覆盖（编辑内置椅子时使用） ----

const OVERRIDES_KEY = "chair-picker-overrides";

/** 加载所有覆盖数据 */
export function loadOverrides(): Record<string, Partial<Chair>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/** 保存覆盖数据 */
export function saveOverrides(overrides: Record<string, Partial<Chair>>): void {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

/** 更新单把椅子的覆盖数据 */
export function updateChairOverride(id: string, data: Partial<Chair>): void {
  const overrides = loadOverrides();
  overrides[id] = { ...overrides[id], ...data };
  saveOverrides(overrides);
}

/** 将覆盖数据应用到椅子列表 */
export function applyOverrides(chairs: Chair[]): Chair[] {
  const overrides = loadOverrides();
  return chairs.map(c => {
    if (overrides[c.id]) {
      return { ...c, ...overrides[c.id] } as Chair;
    }
    return c;
  });
}
