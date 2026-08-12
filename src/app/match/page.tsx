"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { chairs } from "@/data/chairs";
import { matchAllChairs } from "@/engine/matcher";
import { calculateBodyDimensions } from "@/engine/formulas";
import type { ChairMatch, BodyDimensions } from "@/engine/types";
import Link from "next/link";
import ComparisonView from "@/components/visualization/ComparisonView";
import DimensionBar from "@/components/visualization/DimensionBar";

function useQueryParams() {
  const [params, setParams] = useState<{ h: string; w: string }>({ h: "", w: "" });
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      setParams({ h: sp.get("h") || "", w: sp.get("w") || "" });
    }
  }, []);
  return params;
}

export default function MatchPage() {
  const router = useRouter();
  const { h: hStr, w: wStr } = useQueryParams();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  const H = parseFloat(hStr);
  const W = parseFloat(wStr);
  const isValid = !isNaN(H) && !isNaN(W) && H >= 130 && H <= 220 && W >= 30 && W <= 150;

  const body = useMemo(() => isValid ? calculateBodyDimensions(H, W) : null, [H, W, isValid]);
  const matches = useMemo(() => isValid ? matchAllChairs(chairs, H, W) : [], [H, W, isValid]);

  if (!loaded) return <div className="flex items-center justify-center py-20"><p className="text-neutral-400">加载中...</p></div>;
  if (!isValid) return <div className="flex flex-col items-center justify-center py-20 px-4"><p className="text-neutral-500 text-lg mb-4">参数不完整或不合法</p><Link href="/" className="text-blue-600 hover:underline">← 返回首页重新输入</Link></div>;
  if (!body) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/")} className="text-sm text-neutral-500 hover:text-neutral-800 transition-colors">← 返回修改</button>
        <span className="text-xs text-neutral-400">{H}cm / {W}kg</span>
      </div>
      <BodyCard body={body} />
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">匹配结果 <span className="text-neutral-400 font-normal text-sm">({matches.length} 款椅子)</span></h2>
        <div className="space-y-3">
          {matches.map((match, i) => <ChairCard key={match.chair.id} match={match} rank={i + 1} body={body} userHeight={H} />)}
        </div>
      </div>
    </div>
  );
}

function BodyCard({ body }: { body: BodyDimensions }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-blue-800 mb-3">📐 你的估算身体数据</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div><span className="text-neutral-400">坐高需求</span><p className="font-semibold text-neutral-900">{body.seatHeight.min}-{body.seatHeight.max}cm</p></div>
        <div><span className="text-neutral-400">坐深需求</span><p className="font-semibold text-neutral-900">{body.seatDepth.min}-{body.seatDepth.max}cm</p></div>
        <div><span className="text-neutral-400">坐宽需求</span><p className="font-semibold text-neutral-900">{body.seatWidth}cm</p></div>
        <div><span className="text-neutral-400">背高需求</span><p className="font-semibold text-neutral-900">{body.backHeight.min}-{body.backHeight.max}cm</p></div>
      </div>
      <details className="mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer hover:text-neutral-700">查看更多推算数据</summary>
        <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-white/60 rounded-lg">
          <div>扶手高需求: {body.armrestHeight.min}-{body.armrestHeight.max}cm</div><div>扶手宽需求: {body.armrestWidth}cm</div>
          <div>头枕中心: {body.headrestCenter}cm</div><div>头枕需求: {(body.headrestNeedScore * 100).toFixed(0)}%</div>
          <div>后仰力度: {body.reclineTension}/10</div><div>坐垫硬度: {body.seatFirmness}/10</div>
          <div>腰撑位置: {body.lumbarPosition.min}-{body.lumbarPosition.max}cm</div><div>腰撑深度: {body.lumbarDepth}cm</div>
        </div>
      </details>
    </div>
  );
}

function ChairCard({ match, rank, body, userHeight }: { match: ChairMatch; rank: number; body: BodyDimensions; userHeight: number }) {
  const { chair, overallScore, dimensions } = match;
  const [expanded, setExpanded] = useState(false);
  const topDims = dimensions.filter(d => !d.chairDataMissing).slice(0, 3);
  const coreDims = dimensions.filter(d => ["seatHeight","seatDepth","seatWidth","backHeight","armrestHeight"].includes(d.key) && !d.chairDataMissing);
  const sc = overallScore >= 85 ? "bg-emerald-500" : overallScore >= 70 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="border border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-md transition-all overflow-hidden bg-white">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left cursor-pointer group">
        <div className="relative aspect-[3/1] bg-neutral-100 overflow-hidden">
          {chair.imageUrl ? <img src={chair.imageUrl} alt={chair.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 text-neutral-300"><span className="text-5xl">🪑</span><span className="text-xs mt-2 text-neutral-400">暂无图片</span></div>}
          <div className="absolute top-3 right-3"><div className={`${sc} text-white rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-lg`}><span className="text-lg font-bold leading-tight">{overallScore}</span><span className="text-[9px] leading-tight opacity-90">分</span></div></div>
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center backdrop-blur-sm">{rank}</div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8"><h4 className="font-bold text-white text-base truncate">{chair.name}</h4><span className="text-white/70 text-xs">{chair.brand}</span></div>
        </div>
      </button>
      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-2">
          {topDims.map(d => <div key={d.key} className="flex-1 min-w-0"><div className="flex items-center justify-between mb-0.5"><span className="text-[10px] text-neutral-400">{d.label}</span><span className={`text-[10px] font-medium ${d.status==="good"?"text-emerald-600":d.status==="marginal"?"text-amber-600":"text-red-500"}`}>{Math.round(d.coverage*100)}%</span></div><div className="h-1 bg-neutral-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${d.status==="good"?"bg-emerald-500":d.status==="marginal"?"bg-amber-400":"bg-red-400"}`} style={{width:`${Math.round(d.coverage*100)}%`}}/></div></div>)}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {chair.price !== null && <span className="text-sm font-bold text-blue-600">¥{chair.price}</span>}
          {chair.tags.slice(0,3).map(t => <span key={t} className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full">{t}</span>)}
          <button onClick={() => setExpanded(!expanded)} className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium">{expanded?"收起对比 ▲":"查看对比 ▼"}</button>
        </div>
      </div>
      {expanded && <div className="border-t border-neutral-100 p-4 space-y-4 bg-neutral-50/50"><div className="space-y-2"><h4 className="text-sm font-semibold text-neutral-700">📐 尺寸匹配详情</h4>{coreDims.map(d => <DimensionBar key={d.key} label={d.label} userMin={d.userIdeal.min} userMax={d.userIdeal.max} chairMin={d.chairRange.min} chairMax={d.chairRange.max} coverage={d.coverage} status={d.status} />)}</div><ComparisonView body={body} chair={chair} dimensions={dimensions} userHeight={userHeight} /></div>}
    </div>
  );
}
