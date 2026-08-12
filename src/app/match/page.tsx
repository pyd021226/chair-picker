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
    return r.sort((a, b) => b.overallScore - a.overallScore);
  }, [H, W, isValid, allChairs, sitLong]);

  if (!loaded) return <div className="flex items-center justify-center py-24"><div className="skeleton w-40 h-5 rounded-full" /></div>;
  if (!isValid) return <div className="flex flex-col items-center justify-center py-24 gap-3"><p className="text-[var(--text-tertiary)]">参数不完整</p><Link href="/" className="text-[var(--accent)] text-sm hover:underline">返回首页</Link></div>;
  if (!body) return null;

  const top = matches[0];
  const rest = matches.slice(1);

  const accentColor = (s: number) => s === 100 ? "var(--accent)" : s >= 95 ? "var(--success)" : s >= 80 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Nav */}
      <Link href="/" className="inline-flex items-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-200 mb-8">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1"><path d="M10 3L5 8l5 5"/></svg>
        返回修改
      </Link>

      {/* Body badge */}
      <div className="inline-flex flex-wrap items-center gap-3 px-5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl mb-8 shadow-sm">
        <span className="text-xs text-[var(--text-secondary)] font-medium">{H}cm / {W}kg{sitLong ? " / 久坐" : ""}</span>
        <span className="text-[var(--border)] text-xs">|</span>
        <span className="text-xs text-[var(--text-tertiary)]">坐高 <b className="text-[var(--text-primary)]">{body.seatHeight.min}-{body.seatHeight.max}cm</b></span>
        <span className="text-xs text-[var(--text-tertiary)]">坐深 <b className="text-[var(--text-primary)]">{body.seatDepth.min}-{body.seatDepth.max}cm</b></span>
        <span className="text-xs text-[var(--text-tertiary)]">坐宽 <b className="text-[var(--text-primary)]">{body.seatWidth.min}-{body.seatWidth.max}cm</b></span>
      </div>

      {/* Top match: Hero card */}
      {top && (
        <div className="mb-10">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-3">最佳匹配</p>
          <Link href={"/chair/" + top.chair.id + "?h=" + H + "&w=" + W}
            className="group block bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden transition-shadow duration-300"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="flex flex-col sm:flex-row">
              {/* Score hero column */}
              <div className="flex-shrink-0 sm:w-44 flex flex-col items-center justify-center py-8 px-6 border-b sm:border-b-0 sm:border-r border-[var(--border-light)] bg-[var(--accent-subtle)]">
                <span className="text-7xl font-bold tracking-tighter" style={{ color: accentColor(top.overallScore) }}>{top.overallScore}</span>
                <span className="text-xs text-[var(--text-tertiary)] mt-1.5">分</span>
                <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                  {top.overallScore === 100 ? "完美契合" : top.overallScore >= 95 ? "推荐选择" : top.overallScore >= 80 ? "可以一试" : "不太合适"}
                </p>
              </div>
              {/* Info column */}
              <div className="flex-1 p-6 flex flex-col justify-center">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{top.chair.brand}</p>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mt-1 group-hover:text-[var(--accent)] transition-colors duration-200">{top.chair.name}</h2>
                <div className="flex gap-4 mt-4">
                  {top.dimensions.filter(d => !d.chairDataMissing && ["seatHeight","seatDepth","seatWidth"].includes(d.key)).map(d => (
                    <div key={d.key} className="flex-1">
                      <div className="flex justify-between text-xs mb-1"><span className="text-[var(--text-tertiary)]">{d.label}</span><span className="font-medium text-[var(--text-secondary)]">{Math.round(d.coverage * 100)}%</span></div>
                      <div className="h-1.5 bg-[var(--border-light)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: Math.round(d.coverage * 100) + "%", backgroundColor: accentColor(top.overallScore) }} />
                      </div>
                    </div>
                  ))}
                </div>
                {top.chair.price && <p className="text-lg font-bold mt-3" style={{ color: "var(--accent)" }}>{top.chair.price}</p>}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Rest: Bento grid */}
      {rest.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-3">其他选择</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rest.map((m, i) => (
              <Link key={m.chair.id} href={"/chair/" + m.chair.id + "?h=" + H + "&w=" + W}
                className="group block bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-lg transition-all duration-300"
                style={{ animation: "fade-up 0.35s cubic-bezier(0.16,1,0.3,1) both", animationDelay: i * 0.04 + "s" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider truncate">{m.chair.brand}</p>
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm mt-0.5 group-hover:text-[var(--accent)] transition-colors duration-200 line-clamp-2">{m.chair.name}</h3>
                  </div>
                  <span className="flex-shrink-0 ml-2 text-2xl font-bold tracking-tighter" style={{ color: accentColor(m.overallScore) }}>{m.overallScore}</span>
                </div>
                <div className="space-y-1.5">
                  {m.dimensions.filter(d => !d.chairDataMissing && ["seatHeight","seatDepth","seatWidth"].includes(d.key)).map(d => (
                    <div key={d.key} className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-[var(--text-tertiary)]">{d.label}</span>
                      <div className="flex-1 h-1 bg-[var(--border-light)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: Math.round(d.coverage * 100) + "%", backgroundColor: accentColor(m.overallScore) }} />
                      </div>
                      <span className="w-7 text-right font-medium text-[var(--text-secondary)]">{Math.round(d.coverage * 100)}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-light)]">
                  {m.chair.price && <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{m.chair.price}</span>}
                  {sitLong && <span className="text-[10px] font-medium" style={{ color: countFeatures(m.chair) >= 3 ? "var(--success)" : countFeatures(m.chair) >= 2 ? "var(--warning)" : "var(--danger)" }}>功能 {countFeatures(m.chair)}/3</span>}
                  <span className="text-[10px] text-[var(--text-tertiary)] ml-auto group-hover:text-[var(--text-secondary)] transition-colors">详情</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
