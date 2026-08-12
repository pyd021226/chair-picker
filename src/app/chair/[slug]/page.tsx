"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getChairById } from "@/data/chairs";

export default function ChairPage() {
  const params = useParams();
  const slug = params.slug as string;
  const chair = getChairById(slug);

  if (!chair) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-neutral-500 text-lg mb-4">椅子未找到</p>
        <Link href="/" className="text-blue-600 hover:underline">
          ← 返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
        ← 返回首页
      </Link>

      <div className="mt-6">
        <span className="text-xs text-neutral-400">{chair.brand}</span>
        <h1 className="text-2xl font-bold mt-1">{chair.name}</h1>
        {chair.sku && <p className="text-xs text-neutral-400 mt-1">SKU: {chair.sku}</p>}
      </div>

      {/* Price */}
      {chair.price && (
        <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <span className="text-2xl font-bold text-blue-600">¥{chair.price}</span>
          {chair.priceWithFootrest && (
            <span className="text-sm text-neutral-400 ml-2">
              带脚托 ¥{chair.priceWithFootrest}
            </span>
          )}
        </div>
      )}

      {/* Specs */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <Spec label="坐高" value={chair.seatHeight} />
        <Spec label="坐深" value={chair.seatDepth} />
        <Spec label="坐宽" value={chair.seatWidth ? `${chair.seatWidth}cm` : null} />
        <Spec label="背高" value={chair.backHeight} />
        <Spec label="背宽" value={chair.backWidth ? `${chair.backWidth}cm` : null} />
        <Spec label="扶手高" value={chair.armrestHeight} />
        <Spec label="扶手宽" value={chair.armrestWidth ? `${chair.armrestWidth}cm` : null} />
        <Spec label="头枕高" value={chair.headrestHeight} />
        <Spec label="头枕宽" value={chair.headrestWidth ? `${chair.headrestWidth}cm` : null} />
        <Spec label="总高" value={chair.totalHeight} />
        <Spec label="表面材质" value={chair.surface ? surfaceLabel(chair.surface) : null} />
        <Spec label="后仰角度" value={chair.reclineAngle} />
        {chair.baseType && <Spec label="底盘" value={chair.baseType} />}
        {chair.gasCylinder && <Spec label="气压棒" value={chair.gasCylinder} />}
        {chair.baseMaterial && <Spec label="五星杆" value={chair.baseMaterial} />}
      </div>

      {/* Features */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">功能特性</h3>
        <div className="space-y-2 text-sm">
          {chair.lumbarFunc && <Feature label="腰撑" value={chair.lumbarFunc} />}
          {chair.armrestFunc && <Feature label="扶手" value={chair.armrestFunc} />}
          {chair.headrestFunc && <Feature label="头枕" value={chair.headrestFunc} />}
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex gap-1.5 flex-wrap">
        {chair.tags.map((tag) => (
          <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: { min: number; max: number } | string | null }) {
  if (value === null) return null;
  let display: string;
  if (typeof value === "object") {
    display = value.min === value.max ? `${value.min}cm` : `${value.min}-${value.max}cm`;
  } else {
    display = value;
  }
  return (
    <div className="bg-neutral-50 rounded-lg p-2.5">
      <span className="text-neutral-400 text-xs">{label}</span>
      <p className="font-medium text-sm">{display}</p>
    </div>
  );
}

function Feature({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-neutral-400 w-10 flex-shrink-0">{label}</span>
      <span className="text-neutral-800">{value}</span>
    </div>
  );
}

function surfaceLabel(s: string): string {
  switch (s) {
    case "mesh": return "网布";
    case "sponge": return "海绵/软包";
    case "leather": return "真皮";
    case "fabric": return "布面";
    default: return s;
  }
}
