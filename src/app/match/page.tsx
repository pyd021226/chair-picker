"use client";

import { useEffect, useMemo, useState } from "react";
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

const scoreColor = (v: number) => v >= 100 ? "#2563eb" : v >= 95 ? "#16a34a" : v >= 80 ? "#ca8a04" : "#dc2626";

/* 电商商品卡：顶部大照片 + 下方信息 */
function ChairCard({ match, sitLong }: { match: any; sitLong: boolean }) {
  const { chair, overallScore } = match;
  const dims = match.dimensions.filter((d: any) => !d.chairDataMissing && ["seatHeight", "seatDepth", "seatWidth"].includes(d.key));

  return (
    <Link
      href={"/chair/" + chair.id + "?h=" + match.h + "&w=" + match.w + (sitLong ? "&sit=1" : "")}
      className="flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden h-full transition-shadow duration-300 hover:shadow-lg"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* 顶部大照片 */}
      <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
        {chair.imageUrl ? (
          <img src={chair.imageUrl} alt={chair.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 text-4xl text-neutral-300 select-none">
            {chair.brand.slice(0, 1)}
          </div>
        )}
        {/* 分数徽章悬浮右上角 */}
        <div
          className="absolute top-2 right-2 rounded-full text-white text-sm font-bold flex items-center justify-center"
          style={{ backgroundColor: scoreColor(overallScore), width: "44px", height: "44px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        >
          {overallScore}
        </div>
      </div>

      {/* 下方信息 */}
      <div className="flex flex-col flex-1 p-3">
        <p className="text-[10px] text-neutral-400">{chair.brand}</p>
        <h3 className="font-semibold text-neutral-900 text-sm mt-0.5 line-clamp-2">{chair.name}</h3>

        {/* 维度条 + 渐隐提示 */}
        <div className="relative mt-2">
          <div className="space-y-1">
            {dims.map((d: any) => (
              <div key={d.key} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-neutral-400 flex-shrink-0">{d.label}</span>
                <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: Math.round(d.coverage * 100) + "%", backgroundColor: scoreColor(d.coverage * 100) }} />
                </div>
                <span className="w-7 text-right font-medium text-neutral-600 flex-shrink-0">{Math.round(d.coverage * 100)}%</span>
              </div>
            ))}
          </div>
          {/* 渐隐提示：暗示下面还有更多维度 */}
          <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-neutral-300 pointer-events-none">
            更多维度 · 点进详情
          </div>
        </div>

        {/* 价格 + 功能 */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 mt-2">
          {chair.price ? <span className="text-sm font-bold text-blue-600">¥{chair.price}</span> : <span />}
          {sitLong && (
            <span className="text-[10px] font-medium" style={{ color: countFeatures(chair) >= 3 ? "#16a34a" : countFeatures(chair) >= 2 ? "#ca8a04" : "#dc2626" }}>
              功能 {countFeatures(chair)}/3
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* 分组区块：满分区默认展开，其他默认收起 */
function GroupSection({ group, sitLong, expanded, onToggle }: { group: any; sitLong: boolean; expanded: boolean; onToggle: () => void }) {
  if (group.list.length === 0) return null;

  return (
    <div className="mb-8">
      {/* 分组标题（可点击展开/收起） */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 text-sm font-bold mb-4 cursor-pointer select-none text-left"
      >
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold" style={{ backgroundColor: group.color }}>
          {group.icon}
        </span>
        <span style={{ color: group.color }}>{group.label}</span>
        <span className="text-neutral-400 font-normal text-xs">({group.list.length})</span>
        <span className="ml-auto text-xs text-neutral-300">{expanded ? "收起 ▲" : "展开 ▼"}</span>
      </button>

      {/* 卡片网格 */}
      {expanded && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {group.list.map((m: any, i: number) => (
            <div key={m.chair.id} style={{ animation: `fade-up 0.3s cubic-bezier(0.16,1,0.3,1) both ${i * 0.04}s` }}>
              <ChairCard match={m} sitLong={sitLong} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  const { h: hStr, w: wStr, sit: sitStr } = useQueryParams();
  const [loaded, setLoaded] = useState(false);
  // 满分区(perfect)默认展开，其他默认收起
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["perfect"]));
  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  const H = parseFloat(hStr), W = parseFloat(wStr);
  const isValid = !isNaN(H) && !isNaN(W) && H >= 130 && H <= 220 && W >= 30 && W <= 150;
  const sitLong = sitStr === "1";

  const body = useMemo(() => isValid ? calculateBodyDimensions(H, W) : null, [H, W, isValid]);
  const [allChairs, setAllChairs] = useState(chairs);
  useEffect(() => { setAllChairs(applyOverrides([...chairs, ...loadCustomChairs()])); }, []);
  const matches = useMemo(() => {
    if (!isValid) return [];
    let r = matchAllChairs(allChairs, H, W);
    if (sitLong) r = r.map(m => ({ ...m, overallScore: Math.round(m.overallScore * 0.75 + (countFeatures(m.chair) / 3) * 25) }));
    r = r.map(m => ({ ...m, h: H, w: W }));
    return r.sort((a, b) => b.overallScore - a.overallScore);
  }, [H, W, isValid, allChairs, sitLong]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

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
      {groups.map(g => (
        <GroupSection
          key={g.key}
          group={g}
          sitLong={sitLong}
          expanded={expandedGroups.has(g.key)}
          onToggle={() => toggleGroup(g.key)}
        />
      ))}
    </div>
  );
}
