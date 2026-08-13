// ============================================================
// 数据层 — 通过 Supabase 存取（替代 localStorage）
// ============================================================

import type { Chair } from "./types";
import { getSupabase } from "@/lib/supabase";

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

/** 记录一次用户提交 */
export async function recordUsage(data: Omit<UsageRecord, "timestamp">): Promise<void> {
  try {
    await getSupabase().from("usage_records").insert({ data: { ...data, timestamp: Date.now() } });
  } catch { /* 静默失败，不影响主流程 */ }
}

/** 获取所有使用记录 */
export async function getUsageRecords(): Promise<UsageRecord[]> {
  try {
    const { data, error } = await getSupabase().from("usage_records").select("data").order("created_at", { ascending: false }).limit(500);
    if (error) return [];
    return (data || []).map((r: any) => r.data);
  } catch { return []; }
}

/** 清空使用记录（仅管理员） */
export async function clearUsageRecords(): Promise<void> {
  try {
    await getSupabase().from("usage_records").delete().neq("id", 0);
  } catch { /* 静默失败 */ }
}

// ---- 椅子点击追踪（销量榜/收益数据来源） ----

/** 记录一次椅子点击（用户点进某把椅子的详情） */
export async function recordChairClick(chairId: string, chairName: string, chairPrice: number | null, gender: "male" | "female" | null): Promise<void> {
  try {
    await getSupabase().from("chair_clicks").insert({
      chair_id: chairId, chair_name: chairName, chair_price: chairPrice, gender,
    });
  } catch { /* 静默失败 */ }
}

/** 获取所有椅子点击记录（仅管理员） */
export async function getChairClicks(): Promise<any[]> {
  try {
    const { data, error } = await getSupabase().from("chair_clicks").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) return [];
    return data || [];
  } catch { return []; }
}

// ---- 使用统计 ----

export interface UsageStats {
  total: number;
  gender: { male: number; female: number; unknown: number };
  heightDist: { label: string; count: number }[];
  weightDist: { label: string; count: number }[];
  sitLongPct: number;
  budgetAvg: number;
  topHeights: { value: number; count: number }[];
}

export async function getUsageStats(): Promise<UsageStats> {
  const records = await getUsageRecords();
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
    heightMap[`${hBucket}-${hBucket + 4}`] = (heightMap[`${hBucket}-${hBucket + 4}`] || 0) + 1;

    const wBucket = Math.floor(r.weight / 5) * 5;
    weightMap[`${wBucket}-${wBucket + 4}`] = (weightMap[`${wBucket}-${wBucket + 4}`] || 0) + 1;

    if (r.sitLong) sitLongCount++;
    if (r.budgetMax > 0) { budgetSum += (r.budgetMin + r.budgetMax) / 2; budgetCount++; }
  }

  const heightDist = Object.entries(heightMap).map(([label, count]) => ({ label, count })).sort((a, b) => parseInt(a.label) - parseInt(b.label));
  const weightDist = Object.entries(weightMap).map(([label, count]) => ({ label, count })).sort((a, b) => parseInt(a.label) - parseInt(b.label));
  const topHeights = Object.entries(
    records.reduce((acc, r) => { acc[r.height] = (acc[r.height] || 0) + 1; return acc; }, {} as Record<number, number>)
  ).map(([v, c]) => ({ value: parseInt(v), count: c })).sort((a, b) => b.count - a.count).slice(0, 5);

  return {
    total, gender, heightDist, weightDist,
    sitLongPct: total > 0 ? Math.round((sitLongCount / total) * 100) : 0,
    budgetAvg: budgetCount > 0 ? Math.round(budgetSum / budgetCount) : 0,
    topHeights,
  };
}

// ---- 自定义椅子 ----

export async function loadCustomChairs(): Promise<Chair[]> {
  try {
    const { data, error } = await getSupabase().from("custom_chairs").select("data").order("created_at", { ascending: true });
    if (error) return [];
    return (data || []).map((r: any) => r.data);
  } catch { return []; }
}

export async function addCustomChair(chair: Chair): Promise<void> {
  await getSupabase().from("custom_chairs").upsert({ id: chair.id, data: chair });
}

export async function removeCustomChair(id: string): Promise<void> {
  await getSupabase().from("custom_chairs").delete().eq("id", id);
}

// ---- 内置椅子覆盖 ----

export async function loadOverrides(): Promise<Record<string, Partial<Chair>>> {
  try {
    const { data, error } = await getSupabase().from("chair_overrides").select("chair_id, data");
    if (error) return {};
    const result: Record<string, Partial<Chair>> = {};
    for (const r of data || []) result[r.chair_id] = r.data;
    return result;
  } catch { return {}; }
}

export async function updateChairOverride(id: string, data: Partial<Chair>): Promise<void> {
  await getSupabase().from("chair_overrides").upsert({ chair_id: id, data });
}

// ---- 纯函数（不涉及 IO） ----

export function applyOverrides(chairs: Chair[], overrides: Record<string, Partial<Chair>>): Chair[] {
  return chairs.map(c => overrides[c.id] ? { ...c, ...overrides[c.id] } as Chair : c);
}
