"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { chairs } from "@/data/chairs";
import { matchAllChairs } from "@/engine/matcher";
import { calculateBodyDimensions } from "@/engine/formulas";
import type { ChairMatch, BodyDimensions } from "@/engine/types";

function useQueryParams() {
  const [p, setP] = useState({ h: "", w: "" });
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setP({ h: sp.get("h") || "", w: sp.get("w") || "" });
  }, []);
  return p;
}

export default function MatchPage() {
  const router = useRouter();
  const { h: hStr, w: wStr } = useQueryParams();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  const H = parseFloat(hStr), W = parseFloat(wStr);
  const isValid = !isNaN(H) && !isNaN(W) && H >= 130 && H <= 220 && W >= 30 && W <= 150;

  const body = useMemo(() => isValid ? calculateBodyDimensions(H, W) : null, [H, W, isValid]);
  const matches = useMemo(() => isValid ? matchAllChairs(chairs, H, W) : [], [H, W, isValid]);

  if (!loaded) return <div className="flex items-center justify-center py-20"><p className="text-neutral-400">加载中...</p></div>;
  if (!isValid) return <div className="flex flex-col items-center justify-center py-20 px-4"><p className="text-neutral-500 text-lg mb-4">参数不完整或不合法</p><Link href="/" className="text-blue-600 hover:underline">← 返回首页重新输入</Link></div>;
  if (!body) return null;

  // 分组
  const perfect = matches.filter(m => m.overallScore === 100);
  const good = matches.filter(m => m.overallScore >= 95 && m.overallScore < 100);
  const ok = matches.filter(m => m.overallScore >= 80 && m.overallScore < 95);
  const poor = matches.filter(m => m.overallScore < 80);

  const groups: { label: string; icon: string; color: string; chairs: ChairMatch[] }[] = [
    { label: "完美契合", icon: "💎", color: "text-blue-600", chairs: perfect },
    { label: "合适", icon: "✅", color: "text-emerald-600", chairs: good },
    { label: "凑合", icon: "⚠️", color: "text-amber-600", chairs: ok },
    { label: "不建议", icon: "❌", color: "text-red-500", chairs: poor },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push("/")} className="text-sm text-neutral-500 hover:text-neutral-800">← 返回修改</button>
        <span className="text-xs text-neutral-400">{H}cm / {W}kg</span>
      </div>

      {/* Body card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-3 gap-3 text-sm text-center">
          <div><span className="text-neutral-400 text-xs">坐高需求</span><p className="font-semibold">{body.seatHeight.min}-{body.seatHeight.max}cm</p></div>
          <div><span className="text-neutral-400 text-xs">坐深需求</span><p className="font-semibold">{body.seatDepth.min}-{body.seatDepth.max}cm</p></div>
          <div><span className="text-neutral-400 text-xs">坐宽需求</span><p className="font-semibold">{body.seatWidth.min}-{body.seatWidth.max}cm</p></div>
        </div>
      </div>

      {/* Score groups */}
      {groups.map(group => {
        if (group.chairs.length === 0) return null;
        return (
          <div key={group.label} className="mb-6">
            <h3 className={`text-sm font-bold mb-3 ${group.color}`}>
              {group.icon} {group.label} <span className="font-normal text-neutral-400">({group.chairs.length}款)</span>
            </h3>
            <div className="space-y-2">
              {group.chairs.map((m, i) => (
                <Link
                  key={m.chair.id}
                  href={`/chair/${m.chair.id}?h=${H}&w=${W}`}
                  className="block border border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-sm transition-all overflow-hidden bg-white"
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Chair image 2:3 */}
                    <div className="flex-shrink-0 w-16 h-24 rounded-lg bg-neutral-100 overflow-hidden">
                      {m.chair.imageUrl ? (
                        <img src={m.chair.imageUrl} alt={m.chair.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-neutral-300">🪑</div>
                      )}
                    </div>
                    {/* Score badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white ${
                      m.overallScore === 100 ? "bg-blue-500" :
                      m.overallScore >= 95 ? "bg-emerald-500" :
                      m.overallScore >= 80 ? "bg-amber-500" : "bg-red-400"
                    }`}>
                      <span className="text-lg font-bold leading-tight">{m.overallScore}</span>
                      <span className="text-[9px] leading-tight opacity-90">分</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-neutral-900 truncate text-sm">{m.chair.name}</h4>
                      <span className="text-xs text-neutral-400">{m.chair.brand}</span>

                      {/* Mini bars */}
                      <div className="flex gap-2 mt-1.5">
                        {m.dimensions.filter(d => !d.chairDataMissing && ["seatHeight","seatDepth","seatWidth"].includes(d.key)).map(d => (
                          <div key={d.key} className="flex-1">
                            <div className="flex justify-between mb-0.5">
                              <span className="text-[9px] text-neutral-400">{d.label}</span>
                              <span className={`text-[9px] font-medium ${
                                d.status === "good" ? "text-emerald-600" : d.status === "marginal" ? "text-amber-600" : "text-red-500"
                              }`}>{Math.round(d.coverage*100)}%</span>
                            </div>
                            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                d.status === "good" ? "bg-emerald-500" : d.status === "marginal" ? "bg-amber-400" : "bg-red-400"
                              }`} style={{width:`${Math.round(d.coverage*100)}%`}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price + arrow */}
                    <div className="flex-shrink-0 text-right">
                      {m.chair.price && <span className="text-sm font-bold text-blue-600">¥{m.chair.price}</span>}
                      <div className="text-[10px] text-neutral-300 mt-0.5">详情 →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
