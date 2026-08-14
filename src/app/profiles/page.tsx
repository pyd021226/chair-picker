"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadProfiles, deleteProfile, type Profile } from "@/engine/profiles";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfiles(loadProfiles());
    setLoaded(true);
  }, []);

  const refresh = () => setProfiles(loadProfiles());

  const matchHref = (p: Profile) =>
    "/match?h=" + p.height + "&w=" + p.weight + "&sit=" + (p.sitLong ? "1" : "0") +
    "&g=" + (p.gender || "") + "&bmin=" + p.budgetMin + "&bmax=" + p.budgetMax + "&pid=" + p.id;

  if (!loaded) return <div className="p-8 text-neutral-400">加载中...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">人员管理</h1>
          <p className="text-sm text-neutral-400 mt-1">管理已保存的用户档案</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-full transition-colors duration-200">＋ 添加用户</Link>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-medium">还没有保存的档案</p>
          <p className="text-xs mt-1">点右上角「添加用户」填写第一个人的信息</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map(p => (
            <div key={p.id} className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-float flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#171717] truncate">{p.nickname}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {p.gender === "male" ? "男" : p.gender === "female" ? "女" : "未填"} · {p.height}cm / {p.weight}kg{p.sitLong ? " · 久坐" : ""}
                </p>
              </div>
              <Link href={matchHref(p)} className="px-3 py-1.5 text-xs font-medium text-[#2563eb] hover:bg-[#eff6ff] rounded-lg">查看</Link>
              <Link href={"/?edit=" + p.id} className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-lg">编辑</Link>
              <button onClick={() => { if (confirm("删除「" + p.nickname + "」？")) { deleteProfile(p.id); refresh(); } }} className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 rounded-lg">删除</button>
            </div>
          ))}
        </div>
      )}

      <Link href="/" className="block mt-8 text-center text-sm text-neutral-400 hover:text-neutral-600">← 返回首页</Link>
    </div>
  );
}
