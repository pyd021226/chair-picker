"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import { chairs } from "@/data/chairs";
import { matchAllChairs } from "@/engine/matcher";
import { calculateBodyDimensions } from "@/engine/formulas";
import type { ChairMatch, BodyDimensions } from "@/engine/types";
import { useState } from "react";
import Link from "next/link";
import ComparisonView from "@/components/visualization/ComparisonView";
import DimensionBar from "@/components/visualization/DimensionBar";

function MatchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hStr = searchParams.get("h");
  const wStr = searchParams.get("w");
  const H = parseFloat(hStr || "");
  const W = parseFloat(wStr || "");

  const isValid = !isNaN(H) && !isNaN(W) && H >= 130 && H <= 220 && W >= 30 && W <= 150;

  if (!isValid) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-neutral-500 text-lg mb-4">参数不完整或不合法</p>
        <Link href="/" className="text-blue-600 hover:underline">
          ← 返回首页重新输入
        </Link>
      </div>
    );
  }

  const body = useMemo(() => calculateBodyDimensions(H, W), [H, W]);
  const matches = useMemo(() => matchAllChairs(chairs, H, W), [H, W]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          ← 返回修改
        </button>
        <span className="text-xs text-neutral-400">
          {H}cm / {W}kg
        </span>
      </div>

      {/* Body Estimation Card */}
      <BodyCard body={body} />

      {/* Matches */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">
          匹配结果 <span className="text-neutral-400 font-normal text-sm">({matches.length} 款椅子)</span>
        </h2>
        <div className="space-y-3">
          {matches.map((match, i) => (
            <ChairCard
              key={match.chair.id}
              match={match}
              rank={i + 1}
              body={body}
              userHeight={H}
            />
          ))}
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
        <div>
          <span className="text-neutral-400">坐高需求</span>
          <p className="font-semibold text-neutral-900">
            {body.seatHeight.min}-{body.seatHeight.max}cm
          </p>
        </div>
        <div>
          <span className="text-neutral-400">坐深需求</span>
          <p className="font-semibold text-neutral-900">
            {body.seatDepth.min}-{body.seatDepth.max}cm
          </p>
        </div>
        <div>
          <span className="text-neutral-400">坐宽需求</span>
          <p className="font-semibold text-neutral-900">{body.seatWidth}cm</p>
        </div>
        <div>
          <span className="text-neutral-400">背高需求</span>
          <p className="font-semibold text-neutral-900">
            {body.backHeight.min}-{body.backHeight.max}cm
          </p>
        </div>
      </div>
      <details className="mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer hover:text-neutral-700">查看更多推算数据</summary>
        <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-white/60 rounded-lg">
          <div>扶手高需求: {body.armrestHeight.min}-{body.armrestHeight.max}cm</div>
          <div>扶手宽需求: {body.armrestWidth}cm</div>
          <div>头枕中心: {body.headrestCenter}cm</div>
          <div>头枕需求: {(body.headrestNeedScore * 100).toFixed(0)}%</div>
          <div>后仰力度: {body.reclineTension}/10</div>
          <div>坐垫硬度: {body.seatFirmness}/10</div>
          <div>腰撑位置: {body.lumbarPosition.min}-{body.lumbarPosition.max}cm</div>
          <div>腰撑深度: {body.lumbarDepth}cm</div>
        </div>
      </details>
    </div>
  );
}

function ChairCard({
  match,
  rank,
  body,
  userHeight,
}: {
  match: ChairMatch;
  rank: number;
  body: BodyDimensions;
  userHeight: number;
}) {
  const { chair, overallScore, dimensions, summary } = match;
  const [expanded, setExpanded] = useState(false);
  const topDimensions = dimensions.filter((d) => !d.chairDataMissing).slice(0, 3);
  const coreDimensions = dimensions.filter(
    (d) => ["seatHeight", "seatDepth", "seatWidth", "backHeight", "armrestHeight"].includes(d.key) && !d.chairDataMissing
  );

  return (
    <div className="border border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-sm transition-all overflow-hidden">
      {/* Header — clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          {/* Chair image */}
          <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden">
            {chair.imageUrl ? (
              <img src={chair.imageUrl} alt={chair.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🪑</div>
            )}
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neutral-100 flex flex-col items-center justify-center">
            <span className="text-xs text-neutral-400">#{rank}</span>
            <span className="text-lg font-bold text-neutral-900">{overallScore}%</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-neutral-900 truncate">{chair.name}</h4>
              <span className="text-xs text-neutral-400">{chair.brand}</span>
            </div>

            <div className="mt-2 space-y-1">
              {topDimensions.map((dim) => (
                <div key={dim.key} className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-neutral-400 flex-shrink-0">{dim.label}</span>
                  <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        dim.status === "good"
                          ? "bg-emerald-500"
                          : dim.status === "marginal"
                            ? "bg-amber-400"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${Math.round(dim.coverage * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-neutral-500">{Math.round(dim.coverage * 100)}%</span>
                </div>
              ))}
            </div>

            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500">{summary}</span>
              {chair.price !== null && <span className="text-xs font-semibold text-blue-600">¥{chair.price}</span>}
              {chair.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Expand indicator */}
          <div className="flex-shrink-0 text-neutral-300 text-sm mt-1">{expanded ? "▲" : "▼"}</div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-neutral-100 p-4 space-y-4 bg-neutral-50/50">
          {/* Dimension bars */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-neutral-700">尺寸匹配详情</h4>
            {coreDimensions.map((dim) => (
              <DimensionBar
                key={dim.key}
                label={dim.label}
                userMin={dim.userIdeal.min}
                userMax={dim.userIdeal.max}
                chairMin={dim.chairRange.min}
                chairMax={dim.chairRange.max}
                coverage={dim.coverage}
                status={dim.status}
              />
            ))}
          </div>

          {/* SVG comparison */}
          <ComparisonView body={body} chair={chair} dimensions={dimensions} userHeight={userHeight} />
        </div>
      )}
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-400">加载中...</p>
        </div>
      }
    >
      <MatchContent />
    </Suspense>
  );
}
