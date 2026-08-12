"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { chairs } from "@/data/chairs";
import { matchAllChairs } from "@/engine/matcher";
import { calculateBodyDimensions } from "@/engine/formulas";
import { loadCustomChairs, applyOverrides } from "@/engine/storage";

function useQueryParams() {
  const [p, setP] = useState({ h: "", w: "", sit: "" });
  useEffect(() => { const sp = new URLSearchParams(window.location.search); setP({ h: sp.get("h") || "", w: sp.get("w") || "", sit: sp.get("sit") || "" }); }, []);
  return p;
}

function countFeatures(chair: any): number {
  let n = 0;
  if ((chair.armrestFunc || "").match(/\d+D/g)?.some((d: string) => parseInt(d) >= 3)) n++;
  const lum = chair.lumbarFunc || ""; if (lum.includes("多维") || lum.includes("5D") || lum.includes("4D") || lum.includes("3D")) n++;
  if (chair.headrestAdjustable || (chair.headrestFunc || "").includes("升降")) n++;
  return n;
}

const accentColor = (s: number) => s === 100 ? "#2563eb" : s >= 95 ? "#16a34a" : s >= 80 ? "#ca8a04" : "#dc2626";

/* 单张椅子卡片 */
function ChairCard({ match, sitLong }: { match: any; sitLong: boolean }) {
  const { chair, overallScore } = match;
  const [peek, setPeek] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const dims = match.dimensions.filter((d: any) => !d.chairDataMissing && ["seatHeight","seatDepth","seatWidth"].includes(d.key));

  // 触屏：第一次点击显示照片，第二次才跳转
  const handleClick = (e: React.MouseEvent) => {
    if (!peek && window.matchMedia("(pointer: coarse)").matches) {
      e.preventDefault();
      setPeek(true);
    }
  };

  return (
    <div className="relative group">
      {/* 照片 — 悬停/触屏首次点击后从背后探出 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-2xl overflow-hidden bg-neutral-100 shadow-lg transition-all duration-400 ease-out z-0 pointer-events-none"
        style={{
          width: peek ? "150px" : "100px",
          height: peek ? "200px" : "120px",
          bottom: peek ? "55px" : "35px",
          opacity: peek ? 1 : 0.25,
          transform: `translateX(-50%) translateY(${peek ? "-28px" : "0"})`,
        }}
      >
        {chair.imageUrl ? (
          <img src={chair.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 text-3xl text-neutral-300 select-none">
            {chair.name.slice(0, 1)}
          </div>
        )}
      </div>

      {/* 卡片 */}
      <Link
        ref={linkRef}
        href={"/chair/" + chair.id + "?h=" + match.h + "&w=" + match.w + (sitLong ? "&sit=1" : "")}
        onClick={handleClick}
        className="relative z-10 flex flex-col bg-white border border-neutral-200 rounded-2xl p-4 transition-all duration-300 hover:shadow-md h-full"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)", minHeight: "200px" }}
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 min-h-[40px]">
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{chair.brand}</p>
            <h3 className="font-semibold text-neutral-900 text-sm mt-0.5 line-clamp-2">{chair.name}</h3>
          </div>
          <span className="flex-shrink-0 ml-2 text-2xl font-bold tracking-tighter" style={{ color: accentColor(overallScore) }}>
            {overallScore}
          </span>
        </div>
        <div className="space-y-1.5" style={{ minHeight: "54px" }}>
          {dims.map((d: any) => (
            <div key={d.key} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-neutral-400">{d.label}</span>
              <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: Math.round(d.coverage * 100) + "%", backgroundColor: accentColor(overallScore) }} />
              </div>
              <span className="w-7 text-right font-medium text-neutral-600">{Math.round(d.coverage * 100)}%</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100" style={{ minHeight: "32px" }}>
          {chair.price ? <span className="text-sm font-bold text-blue-600">{chair.price}</span> : <span />}
          {sitLong && (
            <span className="text-[10px] font-medium" style={{ color: countFeatures(chair) >= 3 ? "#16a34a" : countFeatures(chair) >= 2 ? "#ca8a04" : "#dc2626" }}>
              功能 {countFeatures(chair)}/3
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

/* 分组堆叠：默认只显示最低价卡片，点击展开全部（每排最多3个） */
function GroupStack({ list, sitLong, color }: { list: any[]; sitLong: boolean; color: string }) {
  const [expanded, setExpanded] = useState(false);

  // 按价格排序，最低价放最前面
  const sorted = [...list].sort((a, b) => (a.chair.price ?? Infinity) - (b.chair.price ?? Infinity));
  const front = sorted[0];
  const rest = sorted.slice(1);

  if (!expanded) {
    // 堆叠态：只显示一张 + 后面几张的边角
    return (
      <div
        className="relative cursor-pointer"
        onClick={() => setExpanded(true)}
        style={{ height: "210px" }}
      >
        {/* 后面的卡片角（视觉堆叠） */}
        {rest.slice(0, 2).map((m, i) => (
          <div
            key={m.chair.id}
            className="absolute inset-x-0 rounded-2xl border border-neutral-200 bg-neutral-50"
            style={{
              top: (i + 1) * 8,
              transform: `scale(${1 - (i + 1) * 0.03})`,
              height: "100%",
              opacity: 0.5,
            }}
          />
        ))}
        {/* 前面卡片 */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          <ChairCard match={front} sitLong={sitLong} />
        </div>
        {/* 数量徽章 */}
        {list.length > 1 && (
          <div
            className="absolute -top-2 -right-2 z-20 text-white text-xs font-bold rounded-full flex items-center justify-center"
            style={{ backgroundColor: color, width: "28px", height: "28px", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
          >
            +{list.length - 1}
          </div>
        )}
      </div>
    );
  }

  // 展开态：每排最多3个
  return (
    <div className="space-y-2">
      <button onClick={() => setExpanded(false)} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors mb-2">
        收起
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((m, i) => (
          <div key={m.chair.id} style={{ animation: `fade-up 0.3s cubic-bezier(0.16,1,0.3,1) both ${i * 0.04}s` }}>
            <ChairCard match={m} sitLong={sitLong} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* 主页面 */
export default function MatchPage() {
  const { h: hStr, w: wStr, sit: sitStr } = useQueryParams();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  const H = parseFloat(hStr), W = parseFloat(wStr);
  const isValid = !isNaN(H) && !isNaN(W) && H >= 130 && H <= 220 && W >= 30 && W <= 150;
  const sitLong = sitStr === "1";

  const body = useMemo(() => isValid ? calculateBodyDimensions(H, W) : null, [H, W, isValid]);
  const allChairs = useMemo(() => applyOverrides([...chairs, ...loadCustomChairs()]), []);
  const matches = useMemo(() => {
    if (!isValid) return [];
    let r = matchAllChairs(allChairs, H, W);
    if (sitLong) r = r.map(m => ({ ...m, overallScore: Math.round(m.overallScore * 0.75 + (countFeatures(m.chair) / 3) * 25) }));
    // 注入 h, w 参数给每个 match，方便卡片构建链接
    r = r.map(m => ({ ...m, h: H, w: W }));
    return r.sort((a, b) => b.overallScore - a.overallScore);
  }, [H, W, isValid, allChairs, sitLong]);

  if (!loaded) return <div className="flex items-center justify-center py-24"><div className="h-5 w-40 rounded-full bg-neutral-100 animate-pulse" /></div>;
  if (!isValid) return <div className="flex flex-col items-center justify-center py-24 gap-3"><p className="text-neutral-400">参数不完整</p><Link href="/" className="text-blue-600 text-sm hover:underline">返回首页</Link></div>;
  if (!body) return null;

  const groups = [
    { key: "perfect", label: "完美契合", icon: "P", color: "#2563eb", list: matches.filter(m => m.overallScore === 100) },
    { key: "good", label: "合适", icon: "G", color: "#16a34a", list: matches.filter(m => m.overallScore >= 95 && m.overallScore < 100) },
    { key: "ok", label: "凑合", icon: "O", color: "#ca8a04", list: matches.filter(m => m.overallScore >= 80 && m.overallScore < 95) },
    { key: "poor", label: "不建议", icon: "N", color: "#dc2626", list: matches.filter(m => m.overallScore < 80) },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Nav */}
      <Link href="/" className="inline-flex items-center text-sm text-neutral-400 hover:text-neutral-600 transition-colors duration-200 mb-6">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1"><path d="M10 3L5 8l5 5"/></svg>
        返回修改
      </Link>

      {/* Body badge */}
      <div className="inline-flex flex-wrap items-center gap-3 px-4 py-2 bg-white border border-neutral-200 rounded-xl mb-8 text-xs">
        <span className="text-neutral-700 font-medium">{H}cm / {W}kg{sitLong ? " / 久坐" : ""}</span>
        <span className="text-neutral-200">|</span>
        <span className="text-neutral-400">坐高 <b className="text-neutral-800">{body.seatHeight.min}-{body.seatHeight.max}cm</b></span>
        <span className="text-neutral-400">坐深 <b className="text-neutral-800">{body.seatDepth.min}-{body.seatDepth.max}cm</b></span>
        <span className="text-neutral-400">坐宽 <b className="text-neutral-800">{body.seatWidth.min}-{body.seatWidth.max}cm</b></span>
      </div>

      {/* 分组 */}
      {groups.map(g => {
        if (g.list.length === 0) return null;
        return (
          <div key={g.key} className="mb-10">
            <h3 className="flex items-center gap-2 text-sm font-bold mb-4" style={{ color: g.color }}>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: g.color }}>{g.icon}</span>
              {g.label}
              <span className="text-neutral-400 font-normal text-xs ml-1">({g.list.length})</span>
            </h3>
            <GroupStack list={g.list} sitLong={sitLong} color={g.color} />
          </div>
        );
      })}
    </div>
  );
}
