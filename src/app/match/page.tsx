"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { chairs } from "@/data/chairs";
import { matchAllChairs } from "@/engine/matcher";
import { calculateBodyDimensions } from "@/engine/formulas";
import { loadCustomChairs, applyOverrides } from "@/engine/storage";

function useQueryParams() {
  const [p, setP] = useState({ h: "", w: "", sit: "" });
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setP({ h: sp.get("h") || "", w: sp.get("w") || "", sit: sp.get("sit") || "" });
  }, []);
  return p;
}

function countFeatures(chair: any): number {
  let n = 0;
  const armDirs = (chair.armrestFunc || "").match(/\d+D/g) || [];
  if (armDirs.some((d: string) => parseInt(d) >= 3)) n++;
  const lum = chair.lumbarFunc || "";
  if (lum.includes("多维") || lum.includes("5D") || lum.includes("4D") || lum.includes("3D")) n++;
  if (chair.headrestAdjustable || (chair.headrestFunc || "").includes("升降")) n++;
  return n;
}

const scoreColor = (s: number) =>
  s === 100 ? "bg-[#2563eb]" : s >= 95 ? "bg-emerald-500" : s >= 80 ? "bg-amber-500" : "bg-red-400";

const scoreBg = (s: number) =>
  s === 100 ? "bg-[#eff6ff] border-[#bfdbfe]" : s >= 95 ? "bg-emerald-50 border-emerald-200" : s >= 80 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

const scoreText = (s: number) =>
  s === 100 ? "text-[#2563eb]" : s >= 95 ? "text-emerald-700" : s >= 80 ? "text-amber-700" : "text-red-600";

export default function MatchPage() {
  const { h: hStr, w: wStr, sit: sitStr } = useQueryParams();
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { setLoaded(true); setTimeout(() => setVisible(true), 100); }, []);

  const H = parseFloat(hStr), W = parseFloat(wStr);
  const isValid = !isNaN(H) && !isNaN(W) && H >= 130 && H <= 220 && W >= 30 && W <= 150;
  const sitLong = sitStr === "1";

  const body = useMemo(() => isValid ? calculateBodyDimensions(H, W) : null, [H, W, isValid]);
  const allChairs = useMemo(() => applyOverrides([...chairs, ...loadCustomChairs()]), []);
  const matches = useMemo(() => {
    if (!isValid) return [];
    let r = matchAllChairs(allChairs, H, W);
    if (sitLong) r = r.map(m => {
      const fc = countFeatures(m.chair);
      return { ...m, overallScore: Math.round(m.overallScore * 0.75 + (fc / 3) * 25) };
    });
    return r.sort((a, b) => b.overallScore - a.overallScore);
  }, [H, W, isValid, allChairs, sitLong]);

  if (!loaded) return <div className="flex items-center justify-center py-20"><div className="skeleton w-48 h-6" /></div>;
  if (!isValid) return <div className="flex flex-col items-center justify-center py-20"><p className="text-[#a3a3a3] mb-4">参数不完整</p><Link href="/" className="text-[#2563eb] hover:underline">返回首页</Link></div>;
  if (!body) return null;

  const perfect = matches.filter(m => m.overallScore === 100);
  const good = matches.filter(m => m.overallScore >= 95 && m.overallScore < 100);
  const ok = matches.filter(m => m.overallScore >= 80 && m.overallScore < 95);
  const poor = matches.filter(m => m.overallScore < 80);

  const groups: { label: string; chairs: typeof matches; color: string; icon: string }[] = [
    { label: "完美契合", chairs: perfect, color: "text-[#2563eb]", icon: "P" },
    { label: "合适", chairs: good, color: "text-emerald-600", icon: "G" },
    { label: "凑合", chairs: ok, color: "text-amber-600", icon: "O" },
    { label: "不建议", chairs: poor, color: "text-red-500", icon: "N" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <Link href="/" className="text-sm text-[#a3a3a3] hover:text-[#525252] transition-colors duration-200">返回修改</Link>
        <span className="text-xs text-[#a3a3a3]">{H}cm / {W}kg{sitLong ? " / 久坐" : ""}</span>
      </div>

      {/* Body summary */}
      <div className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 mb-8 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { l: "坐高需求", v: body.seatHeight.min + "-" + body.seatHeight.max + "cm" },
              { l: "坐深需求", v: body.seatDepth.min + "-" + body.seatDepth.max + "cm" },
              { l: "坐宽需求", v: body.seatWidth.min + "-" + body.seatWidth.max + "cm" },
            ].map(d => (
              <div key={d.l}>
                <p className="text-xs text-[#a3a3a3]">{d.l}</p>
                <p className="text-sm font-semibold text-[#171717] mt-0.5">{d.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score groups */}
      <div className={visible ? "stagger" : ""}>
        {groups.map(group => {
          if (group.chairs.length === 0) return null;
          return (
            <div key={group.label} className="mb-8">
              <h3 className={"text-sm font-bold mb-3 flex items-center gap-2 " + group.color}>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-current text-white text-[10px] font-bold">{group.icon}</span>
                {group.label}
                <span className="font-normal text-[#a3a3a3] text-xs ml-1">({group.chairs.length})</span>
              </h3>
              <div className="space-y-3">
                {group.chairs.map(m => (
                  <Link key={m.chair.id} href={"/chair/" + m.chair.id + "?h=" + H + "&w=" + W + (sitLong ? "&sit=1" : "")}
                    className={"block rounded-xl border transition-all duration-200 overflow-hidden pressable " + scoreBg(m.overallScore)}>
                    <div className="flex items-center gap-4 p-4">
                      {/* Score badge */}
                      <div className={"flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white " + scoreColor(m.overallScore)}>
                        <span className="text-lg font-bold leading-tight">{m.overallScore}</span>
                        <span className="text-[9px] leading-tight opacity-90">分</span>
                      </div>
                      {/* Chair image placeholder */}
                      <div className="flex-shrink-0 w-12 h-16 rounded-lg bg-[#f5f5f5] overflow-hidden">
                        {m.chair.imageUrl ? <img src={m.chair.imageUrl} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-xl text-[#d4d4d4] select-none">C</div>}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#171717] text-sm truncate">{m.chair.name}</h4>
                        <p className="text-xs text-[#a3a3a3]">{m.chair.brand}</p>
                        <div className="flex gap-2 mt-1.5">
                          {m.dimensions.filter(d => !d.chairDataMissing && ["seatHeight","seatDepth","seatWidth"].includes(d.key)).map(d => (
                            <div key={d.key} className="flex-1">
                              <div className="flex justify-between mb-0.5">
                                <span className="text-[9px] text-[#a3a3a3]">{d.label}</span>
                                <span className={"text-[9px] font-medium " + (d.status === "good" ? "text-emerald-600" : d.status === "marginal" ? "text-amber-600" : "text-red-500")}>{Math.round(d.coverage * 100)}%</span>
                              </div>
                              <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                                <div className={"h-full rounded-full transition-all " + (d.status === "good" ? "bg-emerald-500" : d.status === "marginal" ? "bg-amber-400" : "bg-red-400")} style={{ width: Math.round(d.coverage * 100) + "%" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Feature count */}
                        {sitLong && (
                          <p className={"text-[9px] font-medium mt-1 " + (countFeatures(m.chair) >= 3 ? "text-emerald-600" : countFeatures(m.chair) >= 2 ? "text-amber-600" : "text-red-500")}>
                            功能性 {countFeatures(m.chair)}/3
                          </p>
                        )}
                      </div>
                      {/* Price */}
                      <div className="flex-shrink-0 text-right">
                        {m.chair.price && <p className="text-sm font-bold text-[#2563eb]">{m.chair.price}</p>}
                        <p className="text-[10px] text-[#d4d4d4] mt-0.5">详情</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
