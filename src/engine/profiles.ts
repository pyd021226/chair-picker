// ============================================================
// 用户档案 — localStorage 持久化（静态站，本设备记住用户）
// ============================================================

export interface Profile {
  id: string;
  nickname: string;
  gender: "male" | "female" | null;
  height: number;
  weight: number;
  budgetMin: number;
  budgetMax: number;
  sitLong: boolean;
  updatedAt: number;
}

const KEY = "chair_picker_profiles";

/** 生成唯一 id（浏览器环境） */
export function newProfileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** 读取所有档案（按更新时间倒序） */
export function loadProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch { return []; }
}

/** 保存/更新一个档案（按 id 判断新增还是覆盖） */
export function saveProfile(p: Profile): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadProfiles();
    const idx = all.findIndex(x => x.id === p.id);
    if (idx >= 0) all[idx] = p; else all.push(p);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* 静默失败 */ }
}

/** 删除一个档案 */
export function deleteProfile(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadProfiles().filter(x => x.id !== id);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* 静默失败 */ }
}

/** 按 id 取档案 */
export function getProfile(id: string): Profile | null {
  if (typeof window === "undefined") return null;
  return loadProfiles().find(x => x.id === id) || null;
}

const SESSION_KEY = "chair_picker_last_session";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** 记住当前档案，7 天内再打开网站直达匹配页 */
export function touchLastSession(profileId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: profileId, at: Date.now() }));
  } catch { /* 静默失败 */ }
}

export function profileMatchHref(p: Profile): string {
  return "/match?h=" + p.height + "&w=" + p.weight + "&sit=" + (p.sitLong ? "1" : "0") +
    "&g=" + (p.gender || "") + "&bmin=" + p.budgetMin + "&bmax=" + p.budgetMax + "&pid=" + p.id;
}

/** 7 天内有记忆则返回该档案，否则 null */
export function getRememberedProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      const last = loadProfiles()[0];
      if (last && Date.now() - last.updatedAt < WEEK_MS) return last;
      return null;
    }
    const s = JSON.parse(raw) as { id: string; at: number };
    if (!s?.id || Date.now() - s.at > WEEK_MS) return null;
    return getProfile(s.id);
  } catch { return null; }
}
