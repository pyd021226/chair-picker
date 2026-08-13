// ============================================================
// Supabase 客户端 + 数据层
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://ljfvtwrcmyzretsbbwez.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZnZ0d3JjbXl6cmV0c2Jid2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjI0MDMsImV4cCI6MjEwMjE5ODQwM30.j3aKaGzXs3JuDo43yQmcrl83UhYhd39jFi966NVYICQ";

let client: SupabaseClient | null = null;

/** 获取 Supabase 客户端（浏览器环境才可用） */
export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Supabase 客户端只能在浏览器环境使用");
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

/** 判断是否已登录（后台管理员） */
export async function isAdminLoggedIn(): Promise<boolean> {
  const { data } = await getSupabase().auth.getSession();
  return !!data.session;
}

/** 管理员登录 */
export async function adminLogin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** 管理员退出 */
export async function adminLogout(): Promise<void> {
  await getSupabase().auth.signOut();
}
