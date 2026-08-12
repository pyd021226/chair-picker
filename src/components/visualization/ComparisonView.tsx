// ============================================================
// 人体 vs 椅子 SVG 对比图
// 坐标系：毫米 (mm)，以人体比例为标准
// ============================================================

"use client";

import { useMemo, useState } from "react";
import type { BodyDimensions, Chair, DimensionResult } from "@/engine/types";

interface Props {
  body: BodyDimensions;
  chair: Chair;
  dimensions: DimensionResult[];
  userHeight: number; // cm
}

/** fit 状态 → 颜色 */
function fitColor(status: string): string {
  switch (status) {
    case "good": return "#10b981";
    case "marginal": return "#f59e0b";
    default: return "#ef4444";
  }
}

/** 圆形测量点组件 */
function MeasureDot({
  x, y, label, color, side = "left",
}: {
  x: number; y: number; label: string; color: string; side?: "left" | "right";
}) {
  const textAnchor = side === "left" ? "end" : "start";
  const textX = side === "left" ? x - 6 : x + 6;
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} stroke="white" strokeWidth={1.5} />
      <text x={textX} y={y + 4} textAnchor={textAnchor} fontSize={9} fill="#6b7280">
        {label}
      </text>
    </g>
  );
}

export default function ComparisonView({ body, chair, dimensions, userHeight }: Props) {
  const [activeDim, setActiveDim] = useState<string | null>(null);

  // 坐标计算（单位：mm）
  const layout = useMemo(() => {
    const H_mm = userHeight * 10; // 身高 mm
    const sittingHeight = H_mm * 0.53; // 坐高约 53% 身高
    const poplitealH = H_mm * 0.245; // 腘窝高约 24.5% 身高
    const floor = sittingHeight + 200; // 坐姿头顶 + 余量

    return {
      viewW: 1400,
      viewH: floor + 200,
      floorY: floor,
      seatY: floor - poplitealH, // 座面
      shoulderY: floor - poplitealH - H_mm * 0.355, // 肩高（座面+坐姿肩高）
      headY: floor - sittingHeight, // 头顶
      elbowY: floor - poplitealH - H_mm * 0.158, // 肘高
      kneeX_right: 0, // 将在下面计算
      hipX: 0,
    };
  }, [userHeight]);

  const { viewW, viewH, floorY, seatY, shoulderY, headY, elbowY } = layout;

  // 人体中心 X
  const humanCX = 320;
  // 椅子中心 X
  const chairCX = 1050;

  // 人体关键点
  const bodyPoints = {
    headTop: { x: humanCX, y: headY },
    shoulder: { x: humanCX, y: shoulderY },
    hip: { x: humanCX, y: seatY },
    knee: { x: humanCX + 140, y: seatY + 20 }, // 膝盖略低于座面
    footHeel: { x: humanCX + 160, y: floorY },
    elbow: { x: humanCX + 60, y: elbowY },
  };

  // 椅子关键点
  const chairSH = chair.seatHeight;
  const chairSD = chair.seatDepth;
  const chairSW = chair.seatWidth;
  const chairBH = chair.backHeight;
  const chairAH = chair.armrestHeight;
  const chairHH = chair.headrestHeight;

  const chairSeatTop = chairSH ? floorY - (chairSH.min + chairSH.max) / 2 * 10 : seatY;
  const chairSeatFront = chairSD ? (chairSD.max) * 10 : 140;
  const chairBackTop = chairBH
    ? chairSeatTop - (chairBH.min + chairBH.max) / 2 * 10
    : shoulderY;
  const chairArmTop = chairAH
    ? floorY - (chairAH.min + chairAH.max) / 2 * 10
    : elbowY;
  const chairHeadTop = chairHH ? chairSeatTop - (chairHH.min + chairHH.max) / 2 * 10 : headY - 50;

  const chairPoints = {
    seatTop: { x: chairCX - 60, y: chairSeatTop },
    seatFront: { x: chairCX - 60 + chairSeatFront, y: chairSeatTop },
    backTop: { x: chairCX - 60, y: chairBackTop },
    headTop: { x: chairCX - 60, y: chairHeadTop },
    armTop: { x: chairCX - 80, y: chairArmTop },
  };

  // 维度连接线定义
  const connectors = [
    {
      key: "seatHeight",
      label: "坐高",
      bodyPoint: { x: humanCX, y: seatY },
      chairPoint: { x: chairCX - 60, y: chairSeatTop },
      bodyLabel: `腘窝 ${body.seatHeight.min}-${body.seatHeight.max}cm`,
      chairLabel: chairSH ? `座面 ${chairSH.min}-${chairSH.max}cm` : "—",
    },
    {
      key: "seatDepth",
      label: "坐深",
      bodyPoint: { x: humanCX + 140, y: seatY + 30 },
      chairPoint: { x: chairCX - 60 + chairSeatFront, y: chairSeatTop + 10 },
      bodyLabel: `臀腘 ${body.seatDepth.min}-${body.seatDepth.max}cm`,
      chairLabel: chairSD ? `座深 ${chairSD.min}-${chairSD.max}cm` : "—",
    },
    {
      key: "backHeight",
      label: "背高",
      bodyPoint: { x: humanCX + 30, y: shoulderY },
      chairPoint: { x: chairCX - 50, y: chairBackTop },
      bodyLabel: `肩高 ${body.backHeight.min}-${body.backHeight.max}cm`,
      chairLabel: chairBH ? `背高 ${chairBH.min}-${chairBH.max}cm` : "—",
    },
    {
      key: "armrestHeight",
      label: "扶手",
      bodyPoint: { x: humanCX + 60, y: elbowY },
      chairPoint: { x: chairCX - 70, y: chairArmTop },
      bodyLabel: `肘高 ${body.armrestHeight.min}-${body.armrestHeight.max}cm`,
      chairLabel: chairAH ? `扶手 ${chairAH.min}-${chairAH.max}cm` : "—",
    },
  ];

  // 查找各维度的 fit status
  function getStatus(key: string): string {
    const d = dimensions.find((d) => d.key === key);
    return d?.status || "good";
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-700">📐 身体数据对比</span>
        <span className="text-[10px] text-neutral-400">单位：cm | 绿色=匹配 · 黄色=尚可 · 红色=不匹配</span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="w-full min-w-[600px] h-auto"
          style={{ maxHeight: "70vh" }}
        >
          {/* 背景网格 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={viewW} height={viewH} fill="url(#grid)" />

          {/* 地面线 */}
          <line x1={50} y1={floorY} x2={viewW - 50} y2={floorY} stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="6,3" />
          <text x={viewW / 2} y={floorY + 20} textAnchor="middle" fontSize={10} fill="#9ca3af">
            地面
          </text>

          {/* ============ 人体轮廓 ============ */}
          <g id="human-silhouette">
            {/* 头 */}
            <ellipse cx={humanCX} cy={headY + 30} rx={30} ry={40} fill="none" stroke="#374151" strokeWidth={2} />
            {/* 躯干 */}
            <line x1={humanCX} y1={headY + 70} x2={humanCX} y2={seatY - 50} stroke="#374151" strokeWidth={3} />
            {/* 上躯干宽线 */}
            <line x1={humanCX - 50} y1={shoulderY + 20} x2={humanCX + 50} y2={shoulderY + 20} stroke="#374151" strokeWidth={2} />
            {/* 髋部宽线 */}
            <line x1={humanCX - 60} y1={seatY - 30} x2={humanCX + 60} y2={seatY - 30} stroke="#374151" strokeWidth={2} />
            {/* 大腿 */}
            <rect x={humanCX} y={seatY - 20} width={150} height={35} rx={10} fill="none" stroke="#374151" strokeWidth={2} />
            {/* 小腿 */}
            <rect x={humanCX + 120} y={seatY + 15} width={35} height={floorY - seatY - 15} rx={8} fill="none" stroke="#374151" strokeWidth={2} />
            {/* 脚 */}
            <rect x={humanCX + 115} y={floorY - 10} width={60} height={12} rx={4} fill="none" stroke="#374151" strokeWidth={2} />
            {/* 上臂 */}
            <line x1={humanCX + 30} y1={shoulderY + 20} x2={humanCX + 70} y2={elbowY} stroke="#374151" strokeWidth={2} />
            {/* 前臂 */}
            <line x1={humanCX + 70} y1={elbowY} x2={humanCX + 90} y2={elbowY + 60} stroke="#374151" strokeWidth={2} />
          </g>

          {/* 人体标签 */}
          <text x={humanCX} y={headY - 15} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#374151">
            你的身体
          </text>

          {/* ============ 椅子轮廓 ============ */}
          <g id="chair-silhouette">
            {/* 座面 */}
            <rect
              x={chairCX - 60} y={chairSeatTop}
              width={chairSeatFront} height={15}
              rx={3} fill="#e5e7eb" stroke="#374151" strokeWidth={2}
            />
            {/* 靠背 */}
            <rect
              x={chairCX - 60} y={chairBackTop}
              width={12} height={chairSeatTop - chairBackTop}
              rx={3} fill="#e5e7eb" stroke="#374151" strokeWidth={2}
            />
            {/* 头枕 */}
            {chairHH && (
              <rect
                x={chairCX - 60} y={chairHeadTop}
                width={12} height={chairBackTop - chairHeadTop}
                rx={4} fill="#dbeafe" stroke="#374151" strokeWidth={1.5} strokeDasharray="3,2"
              />
            )}
            {/* 扶手 */}
            {chairAH && (
              <>
                <line x1={chairCX - 80} y1={chairArmTop} x2={chairCX - 60} y2={chairArmTop} stroke="#374151" strokeWidth={2.5} />
                <line x1={chairCX - 80} y1={chairArmTop} x2={chairCX - 80} y2={chairSeatTop + 5} stroke="#374151" strokeWidth={1.5} />
              </>
            )}
            {/* 底座/气杆 */}
            <line x1={chairCX - 55} y1={chairSeatTop + 15} x2={chairCX - 55} y2={floorY - 20} stroke="#9ca3af" strokeWidth={3} />
            {/* 五星脚 */}
            <line x1={chairCX - 110} y1={floorY - 20} x2={chairCX - 0} y2={floorY - 20} stroke="#9ca3af" strokeWidth={3} />
          </g>

          {/* 椅子标签 */}
          <text x={chairCX - 30} y={headY - 15} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#374151">
            {chair.name.length > 10 ? chair.name.slice(0, 10) + "..." : chair.name}
          </text>

          {/* ============ 维度连接线 ============ */}
          {connectors.map((conn) => {
            const status = getStatus(conn.key);
            const color = fitColor(status);
            const isActive = activeDim === conn.key;
            const opacity = isActive ? 1 : activeDim ? 0.2 : 0.7;

            return (
              <g
                key={conn.key}
                opacity={opacity}
                className="cursor-pointer transition-opacity duration-200"
                onClick={() => setActiveDim(activeDim === conn.key ? null : conn.key)}
                onMouseEnter={() => setActiveDim(conn.key)}
                onMouseLeave={() => setActiveDim(null)}
              >
                {/* 连线 */}
                <line
                  x1={conn.bodyPoint.x} y1={conn.bodyPoint.y}
                  x2={conn.chairPoint.x} y2={conn.chairPoint.y}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={isActive ? "none" : "4,2"}
                />
                {/* 人体侧测量点 */}
                <MeasureDot x={conn.bodyPoint.x} y={conn.bodyPoint.y} label={conn.bodyLabel} color={color} side="left" />
                {/* 椅子侧测量点 */}
                <MeasureDot x={conn.chairPoint.x} y={conn.chairPoint.y} label={conn.chairLabel} color={color} side="right" />
                {/* 标签 */}
                {isActive && (
                  <text
                    x={(conn.bodyPoint.x + conn.chairPoint.x) / 2}
                    y={Math.min(conn.bodyPoint.y, conn.chairPoint.y) - 10}
                    textAnchor="middle" fontSize={11} fontWeight="bold" fill={color}
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* 图例 */}
          <g transform={`translate(${viewW - 160}, ${viewH - 50})`}>
            <rect x={0} y={0} width={150} height={42} rx={6} fill="white" stroke="#e5e7eb" />
            {[
              { color: "#10b981", label: "匹配" },
              { color: "#f59e0b", label: "尚可" },
              { color: "#ef4444", label: "不匹配" },
            ].map((item, i) => (
              <g key={item.label} transform={`translate(${8 + i * 48}, 22)`}>
                <line x1={0} y1={0} x2={20} y2={0} stroke={item.color} strokeWidth={2} />
                <text x={24} y={4} fontSize={9} fill="#6b7280">{item.label}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
