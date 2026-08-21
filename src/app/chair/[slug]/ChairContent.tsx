"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getChairById } from "@/data/chairs";
import { calculateBodyDimensions } from "@/engine/formulas";
import { matchAllChairs } from "@/engine/matcher";
import DimensionBar from "@/components/visualization/DimensionBar";
import { RadarChart, CATEGORIES, ACTIVATED } from "@/components/visualization/RadarComparison";
import { loadConfig, loadMatchRules, DEFAULT_CONFIG, DEFAULT_MATCH_RULES, type FormulaConfig, type MatchRules } from "@/engine/config";
import type { DimensionResult } from "@/engine/types";

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
  const [cfg, setCfg] = useState<FormulaConfig>(DEFAULT_CONFIG);
  const [rules, setRules] = useState<MatchRules>(DEFAULT_MATCH_RULES);
  const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQuery({ h: sp.get("h") || "", w: sp.get("w") || "" });
    Promise.all([loadConfig(), loadMatchRules()]).then(([c, r]) => { setCfg(c); setRules(r); });
  }, []);

  const H = parseFloat(query.h), W = parseFloat(query.w);
  const hasUser = !isNaN(H) && !isNaN(W);

  const body = useMemo(() => hasUser ? calculateBodyDimensions(H, W, cfg) : null, [H, W, hasUser, cfg]);
  const match = useMemo(() => {
    if (!hasUser || !chair) return null;
    const matches = matchAllChairs([chair], H, W, rules.weights, cfg, rules);
    return matches[0] || null;
  }, [chair, H, W, hasUser, cfg, rules]);

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

      {/* 名称居中 */}
      <div className="text-center mt-6">
        <p className="text-xs text-neutral-400">{chair.brand}</p>
        <h1 className="text-xl font-bold mt-1">{chair.name}</h1>
      </div>

      {/* 三视图：正 / 侧 / 后 */}
      <div className="grid grid-cols-3 gap-2 mt-5">
        {[
          { label: "正面", src: chair.imageFront || chair.imageUrl },
          { label: "侧面", src: chair.imageSide || null },
          { label: "背面", src: chair.imageBack || null },
        ].map(v => (
          <div key={v.label} className="aspect-[3/4] rounded-xl bg-neutral-100 overflow-hidden flex flex-col items-center justify-center">
            {v.src ? (
              <img src={v.src} alt={chair.name + " " + v.label} className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-3xl text-neutral-300 select-none">🪑</span>
                <span className="text-[10px] text-neutral-400 mt-1">{v.label} · 暂无图片</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 价格 → 链接 */}
      <div className="mt-4 text-center">
        {chair.price ? (
          <p className="text-2xl font-bold text-blue-600">
            ¥{chair.price}
            {chair.priceWithFootrest && <span className="text-sm font-normal text-neutral-400 ml-2">带脚托 ¥{chair.priceWithFootrest}</span>}
          </p>
        ) : (
          <p className="text-sm text-neutral-400">价格暂无</p>
        )}
        {chair.purchaseUrl ? (
          <a href={chair.purchaseUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-sm text-blue-600 hover:underline">
            {chair.purchaseUrl}
          </a>
        ) : (
          <p className="mt-1 text-sm text-neutral-400">暂无</p>
        )}
      </div>

      {/* 匹配评分 */}
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

      {/* 更详细的报告：尺寸对比 + 雷达，默认收起 */}
      {match && body && (
        <div className="mt-4">
          <button
            onClick={() => setReportOpen(v => !v)}
            className="press w-full py-3 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {reportOpen ? "收起详细报告 ▲" : "更详细的报告 ▼"}
          </button>
          {reportOpen && (() => {
            const dimMap: Record<string, DimensionResult> = {};
            for (const d of match.dimensions) dimMap[d.key] = d;
            return (
              <div className="mt-4 space-y-8">
                {CATEGORIES.map(cat => (
                  <div key={cat.title}>
                    <h3 className="font-bold text-neutral-800 mb-3">{cat.title}</h3>
                    <div className="space-y-2 mb-4">
                      {cat.items.map(item => {
                        if (ACTIVATED.has(item.key)) {
                          const dim = dimMap[item.key];
                          if (dim && !dim.chairDataMissing) {
                            return (
                              <DimensionBar key={item.key} dimKey={dim.key} label={item.label}
                                userMin={dim.userIdeal.min} userMax={dim.userIdeal.max}
                                chairMin={dim.chairRange.min} chairMax={dim.chairRange.max}
                                coverage={dim.coverage} status={dim.status} />
                            );
                          }
                          return <NoDataBar key={item.key} label={item.label} />;
                        }
                        const value = getChairDataValue(chair, item.key);
                        return <NoDataBar key={item.key} label={item.label} value={value || undefined} />;
                      })}
                    </div>
                    <RadarChart title={cat.title} items={cat.items} dimMap={dimMap} />
                  </div>
                ))}
              </div>
            );
          })()}
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

      {/* 评价标准 */}
      <div className="mt-6">
        <h3 className="font-bold text-neutral-800 mb-3">评价标准</h3>
        <div className="space-y-2 text-sm">
          {[
            { color: "#2563eb", label: "完美", desc: "所有需求完美覆盖" },
            { color: "#16a34a", label: "合适", desc: "覆盖率 95% ~ 99%" },
            { color: "#ca8a04", label: "凑合", desc: "80% ~ 94%" },
            { color: "#dc2626", label: "不合适", desc: "低于 80%" },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
              <span className="font-medium w-12" style={{ color: r.color }}>{r.label}</span>
              <span className="text-neutral-500">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

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

/** 未激活维度的占位条：有椅子数据显示数据，否则"暂未数据" */
function NoDataBar({ label, value }: { label: string; value?: string }) {
  const hasData = !!value;
  return (
    <div className="rounded-xl p-4 bg-neutral-50 border border-neutral-100">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${hasData ? "text-neutral-700" : "text-neutral-400"}`}>{label}</span>
        <span className={`text-xs ${hasData ? "text-neutral-600" : "text-neutral-300"}`}>{value || "暂未数据"}</span>
      </div>
    </div>
  );
}

/** 从椅子数据提取某维度的值（仅椅子数据，不涉及人的公式） */
function getChairDataValue(chair: any, key: string): string | null {
  const fmt = (v: { min: number; max: number }) => v.min === v.max ? `${v.min}cm` : `${v.min}-${v.max}cm`;
  switch (key) {
    case "backHeight": return chair.backHeight ? fmt(chair.backHeight) : null;
    case "backWidth": return chair.backWidth != null ? `${chair.backWidth}cm` : null;
    case "armrestWidth": return chair.armrestWidth != null ? `${chair.armrestWidth}cm` : null;
    case "headrestRange": return chair.headrestHeight ? fmt(chair.headrestHeight) : null;
    case "lumbarPosition": return chair.lumbarHeight != null ? `${chair.lumbarHeight}cm` : null;
    case "lumbarFunc": return chair.lumbarFunc || null;
    case "headrestFunc": return chair.headrestFunc || null;
    case "armrestFunc": return chair.armrestFunc || null;
    case "capacity": return chair.maxWeight != null ? `承重${chair.maxWeight}kg` : null;
    default: return null;
  }
}
