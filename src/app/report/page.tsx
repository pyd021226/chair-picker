"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getProfile, type Profile } from "@/engine/profiles";
import { calculateBodyDimensions } from "@/engine/formulas";
import { loadConfig, DEFAULT_CONFIG, type FormulaConfig } from "@/engine/config";
import { generateSummaryLines, generatePlan } from "@/engine/summary";

export default function ReportPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cfg, setCfg] = useState<FormulaConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const sp = new URLSearchParams(window.location.search);
      const pid = sp.get("pid") || "";
      setProfile(pid ? getProfile(pid) : null);
      setCfg(await loadConfig());
      setLoaded(true);
    })();
  }, []);

  const body = useMemo(() => (profile ? calculateBodyDimensions(profile.height, profile.weight, cfg) : null), [profile, cfg]);

  if (!loaded) return <div className="flex items-center justify-center py-24 text-neutral-400">加载中...</div>;

  if (!profile || !body) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-4">
        <p className="text-4xl">📄</p>
        <p className="text-neutral-400">未找到报告数据</p>
        <Link href="/" className="text-[#2563eb] text-sm hover:underline">去填写信息</Link>
      </div>
    );
  }

  const gender = profile.gender || "male";
  const summaryLines = generateSummaryLines({ nickname: profile.nickname, gender, height: profile.height, weight: profile.weight, sitLong: profile.sitLong });
  const plan = generatePlan({ nickname: profile.nickname, gender, height: profile.height, weight: profile.weight, sitLong: profile.sitLong, budgetMin: profile.budgetMin, budgetMax: profile.budgetMax });
  const matchHref = "/match?h=" + profile.height + "&w=" + profile.weight + "&sit=" + (profile.sitLong ? "1" : "0") + "&g=" + (profile.gender || "") + "&bmin=" + profile.budgetMin + "&bmax=" + profile.budgetMax + "&pid=" + profile.id;

  const dims = [
    { label: "坐高", unit: "cm", formula: "身高 × 坐高系数（按身高分档）", value: `${body.seatHeight.min}–${body.seatHeight.max}` },
    { label: "坐深", unit: "cm", formula: "身高 × 臀腘比 − 姿势余量 − 间隙", value: `${body.seatDepth.min}–${body.seatDepth.max}` },
    { label: "坐宽", unit: "cm", formula: "0 ~ 臀宽 + 活动余量", value: `${body.seatWidth.min}–${body.seatWidth.max}` },
    { label: "背高", unit: "cm", formula: "身高 × 背高系数", value: `${body.backHeight.min}–${body.backHeight.max}` },
    { label: "背宽", unit: "cm", formula: "身高×系数 + 体重加成", value: String(body.backWidth) },
    { label: "扶手高", unit: "cm", formula: "身高×肘高比 + 偏移", value: `${body.armrestHeight.min}–${body.armrestHeight.max}` },
    { label: "扶手宽(间距)", unit: "cm", formula: "身高×系数 + 体重×系数 + 偏移", value: String(body.armrestWidth) },
    { label: "头枕范围", unit: "cm", formula: "身高 × 头枕系数", value: `${body.headrestRange.min}–${body.headrestRange.max}` },
    { label: "后仰力度", unit: "级(1-10)", formula: "(体重×身高)/除数", value: String(body.reclineTension) },
    { label: "坐垫软硬", unit: "级(1-10)", formula: "(体重−基准)/除数 × 身高修正", value: String(body.seatFirmness) },
    { label: "腰撑力度", unit: "级(1-10)", formula: "(体重−基准)/除数 × 身高修正", value: String(body.lumbarTension) },
    { label: "建议承重", unit: "kg", formula: "体重 + 20kg 安全余量", value: String(body.requiredCapacity) },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">我的报告</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{profile.nickname} · {profile.height}cm / {profile.weight}kg</p>
        </div>
        <Link href={matchHref} className="text-sm text-neutral-400 hover:text-neutral-600">← 返回椅子页</Link>
      </div>

      {/* 一、我的数据 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-[#171717] mb-3">① 我的数据</h2>
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-float">
          <table className="w-full text-sm">
            <tbody>
              {[
                { k: "昵称", v: profile.nickname },
                { k: "性别", v: profile.gender === "male" ? "男" : profile.gender === "female" ? "女" : "未填" },
                { k: "身高", v: profile.height + " cm" },
                { k: "体重", v: profile.weight + " kg" },
                { k: "预算", v: profile.budgetMin && profile.budgetMax ? "¥" + profile.budgetMin + " – ¥" + profile.budgetMax : "未填" },
                { k: "每日久坐", v: profile.sitLong ? "超过 6 小时" : "6 小时以内" },
              ].map(row => (
                <tr key={row.k} className="border-b border-neutral-50 last:border-0">
                  <td className="px-4 py-3 text-neutral-400 w-28">{row.k}</td>
                  <td className="px-4 py-3 text-[#171717] font-medium">{row.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 二、模拟分析 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-[#171717] mb-1">② 模拟分析</h2>
        <p className="text-xs text-neutral-400 mb-3">基于 GB10000-88 中国成年人人体尺寸，用我们的系数公式推算你的身体适配尺寸</p>
        <div className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-float">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-400 text-xs">
                <th className="text-left px-4 py-2 font-medium">维度</th>
                <th className="text-left px-4 py-2 font-medium">计算方式</th>
                <th className="text-right px-4 py-2 font-medium">结果</th>
              </tr>
            </thead>
            <tbody>
              {dims.map(d => (
                <tr key={d.label} className="border-t border-neutral-50">
                  <td className="px-4 py-2.5 text-[#171717] font-medium whitespace-nowrap">{d.label}</td>
                  <td className="px-4 py-2.5 text-neutral-500 text-xs">{d.formula}</td>
                  <td className="px-4 py-2.5 text-right text-[#2563eb] font-semibold whitespace-nowrap">{d.value} <span className="text-neutral-300 text-xs font-normal">{d.unit}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 三、总结 */}
      <section>
        <h2 className="text-base font-bold text-[#171717] mb-3">③ 总结</h2>
        <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-float space-y-2">
          {summaryLines.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: i === 0 ? "#171717" : "#525252", fontWeight: i === 0 ? 600 : 400 }}>
              {line}
            </p>
          ))}
        </div>
        <div className="mt-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#2563eb] mb-1.5">💡 方案思路</p>
          <p className="text-sm text-[#1e40af] leading-relaxed">{plan}</p>
        </div>
      </section>
    </div>
  );
}
