"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { chairs, getChairById } from "@/data/chairs";
import { calculateBodyDimensions } from "@/engine/formulas";
import { matchAllChairs } from "@/engine/matcher";
import DimensionBar from "@/components/visualization/DimensionBar";
import RadarComparison, { CATEGORIES, ACTIVATED } from "@/components/visualization/RadarComparison";
import type { BodyDimensions, ChairMatch } from "@/engine/types";

/** 从 URL pathname 解析 slug：/chair-picker/chair/xxx/ → xxx */
function useSlugFromURL(): string {
  const [slug, setSlug] = useState("");
  useEffect(() => {
    const path = window.location.pathname;
    // 匹配 /chair/xxx 或 /chair/xxx/
    const m = path.match(/\/chair\/([^/]+)/);
    if (m) setSlug(decodeURIComponent(m[1]));
  }, []);
  return slug;
}

export default function ChairContent() {
  const slug = useSlugFromURL();
  const chair = slug ? getChairById(slug) : undefined;

  // 从 URL 读取 h/w 参数
  const [query, setQuery] = useState({ h: "", w: "" });
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQuery({ h: sp.get("h") || "", w: sp.get("w") || "" });
  }, []);

  const H = parseFloat(query.h), W = parseFloat(query.w);
  const hasUser = !isNaN(H) && !isNaN(W);

  const body = useMemo(() => hasUser ? calculateBodyDimensions(H, W) : null, [H, W, hasUser]);
  const match = useMemo(() => {
    if (!hasUser || !chair) return null;
    const matches = matchAllChairs([chair], H, W);
    return matches[0] || null;
  }, [chair, H, W, hasUser]);

  if (!chair) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-neutral-500 text-lg mb-4">椅子未找到</p>
        <Link href="/" className="text-blue-600 hover:underline">← 返回首页</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href={hasUser ? `/match?h=${H}&w=${W}` : "/"} className="text-sm text-neutral-500 hover:text-neutral-800">
        ← {hasUser ? "返回匹配列表" : "返回首页"}
      </Link>

      {/* 标题 + 图片 */}
      <div className="flex gap-4 mt-4">
        {/* 椅子图片 2:3 */}
        <div className="flex-shrink-0 w-40 h-60 rounded-xl bg-neutral-100 overflow-hidden">
          {chair.imageUrl ? (
            <img src={chair.imageUrl} alt={chair.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-5xl text-neutral-300 bg-gradient-to-br from-neutral-50 to-neutral-100">
              🪑<span className="text-xs mt-2 text-neutral-400">暂无图片</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <span className="text-xs text-neutral-400">{chair.brand}</span>
          <h1 className="text-xl font-bold mt-1">{chair.name}</h1>
        </div>
      </div>

      {/* 匹配评分（如果有用户数据） */}
      {match && (
        <div className={`mt-4 rounded-2xl p-5 text-white ${
          match.overallScore === 100 ? "bg-blue-500" :
          match.overallScore >= 95 ? "bg-emerald-500" :
          match.overallScore >= 80 ? "bg-amber-500" : "bg-red-400"
        }`}>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{match.overallScore}<span className="text-lg font-normal">分</span></div>
            <div>
              <p className="font-semibold text-lg">
                {match.overallScore === 100 ? "💎 完美契合" :
                 match.overallScore >= 95 ? "✅ 合适" :
                 match.overallScore >= 80 ? "⚠️ 凑合" : "❌ 不建议"}
              </p>
              <p className="text-sm text-white/80">
                基于 {H}cm / {W}kg 的身体数据
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 价格 */}
      {chair.price && (
        <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-blue-600">¥{chair.price}</span>
          {chair.priceWithFootrest && <span className="text-sm text-neutral-400">带脚托 ¥{chair.priceWithFootrest}</span>}
        </div>
      )}

      {/* 维度对比（尺寸/坐感/功能三组） */}
      {match && body && (
        <div className="mt-6 space-y-6">
          {CATEGORIES.map(cat => (
            <div key={cat.title}>
              <h3 className="font-bold text-neutral-800 mb-3">{cat.title}</h3>
              <div className="space-y-2">
                {cat.items.map(item => {
                  const dim = match.dimensions.find(d => d.key === item.key);
                  const isActivated = ACTIVATED.has(item.key);
                  if (isActivated && dim && !dim.chairDataMissing) {
                    return (
                      <DimensionBar key={item.key} dimKey={dim.key} label={item.label}
                        userMin={dim.userIdeal.min} userMax={dim.userIdeal.max}
                        chairMin={dim.chairRange.min} chairMax={dim.chairRange.max}
                        coverage={dim.coverage} status={dim.status} />
                    );
                  }
                  return <NoDataBar key={item.key} label={item.label} />;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 雷达图 */}
      {match && body && (
        <div className="mt-6">
          <RadarComparison dimensions={match.dimensions} />
        </div>
      )}

      {/* 完整参数 */}
      <div className="mt-6">
        <h3 className="font-bold text-neutral-800 mb-3">📋 完整参数</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Spec label="坐高" v={chair.seatHeight} />
          <Spec label="坐深" v={chair.seatDepth} />
          <Spec label="坐宽" v={chair.seatWidth} />
          <Spec label="背高" v={chair.backHeight} />
          <Spec label="背宽" v={chair.backWidth} />
          <Spec label="扶手高" v={chair.armrestHeight} />
          <Spec label="扶手宽" v={chair.armrestWidth} />
          <Spec label="头枕高" v={chair.headrestHeight} />
          <Spec label="总高" v={chair.totalHeight} />
          <Spec label="表面" v={chair.surface && surfaceLabel(chair.surface)} />
          <Spec label="后仰" v={chair.reclineAngle} />
          {chair.baseType && <Spec label="底盘" v={chair.baseType} />}
          {chair.gasCylinder && <Spec label="气压棒" v={chair.gasCylinder} />}
          {chair.maxWeight && <Spec label="最大承重" v={`${chair.maxWeight}kg`} />}
        </div>
      </div>

      {/* 功能 */}
      {(chair.lumbarFunc || chair.armrestFunc || chair.headrestFunc) && (
        <div className="mt-6">
          <h3 className="font-bold text-neutral-800 mb-2">🔧 功能特性</h3>
          <div className="space-y-1 text-sm">
            {chair.lumbarFunc && <div className="flex gap-2"><span className="text-neutral-400">腰撑</span><span>{chair.lumbarFunc}</span></div>}
            {chair.armrestFunc && <div className="flex gap-2"><span className="text-neutral-400">扶手</span><span>{chair.armrestFunc}</span></div>}
            {chair.headrestFunc && <div className="flex gap-2"><span className="text-neutral-400">头枕</span><span>{chair.headrestFunc}</span></div>}
          </div>
        </div>
      )}

      {!hasUser && (
        <div className="mt-6 p-4 bg-neutral-50 rounded-xl text-center">
          <p className="text-sm text-neutral-500">从匹配页面进入可查看你的专属对比</p>
          <Link href="/" className="text-blue-600 text-sm font-medium hover:underline mt-1 inline-block">去匹配 →</Link>
        </div>
      )}
    </div>
  );
}

function Spec({ label, v }: { label: string; v: { min: number; max: number } | number | string | null }) {
  if (v === null || v === undefined) return null;
  let d: string;
  if (typeof v === "object") d = v.min === v.max ? `${v.min}cm` : `${v.min}-${v.max}cm`;
  else if (typeof v === "number") d = `${v}cm`;
  else d = v;
  return <div className="bg-neutral-50 rounded-lg p-2"><span className="text-neutral-400 text-[10px]">{label}</span><p className="font-medium text-xs">{d}</p></div>;
}

function surfaceLabel(s: string): string {
  switch (s) { case "mesh": return "网布"; case "sponge": return "海绵/软包"; case "leather": return "真皮"; default: return s; }
}

/** 未激活维度的灰色占位条 */
function NoDataBar({ label }: { label: string }) {
  return (
    <div className="rounded-xl p-4 bg-neutral-50 border border-neutral-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-neutral-400">{label}</span>
        <span className="text-xs text-neutral-300">暂未数据</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full" />
    </div>
  );
}
