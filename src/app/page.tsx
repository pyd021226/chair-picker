"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recordUsage } from "@/engine/storage";

const TOTAL_STEPS = 7;

const MALE_H = { mean: 172.5, sd: 5.8 };
const FEMALE_H = { mean: 161.5, sd: 5.3 };
const MALE_BMI = { mean: 22.5, sd: 3.0 };
const FEMALE_BMI = { mean: 21.8, sd: 2.8 };

function percentile(val: number, mean: number, sd: number): number {
  const z = (val - mean) / sd;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = 1 - d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const raw = z > 0 ? p : 1 - p;
  return Math.min(99.9, Math.max(0.1, Math.round(raw * 1000) / 10));
}

function heightLabel(pct: number): { label: string; short: string } {
  if (pct >= 95) return { label: "大高个", short: "高" };
  if (pct >= 80) return { label: "高个子", short: "高" };
  if (pct >= 60) return { label: "中高", short: "中高" };
  if (pct <= 5) return { label: "迷你", short: "矮" };
  if (pct <= 20) return { label: "小个子", short: "矮" };
  if (pct <= 40) return { label: "中小个子", short: "中小" };
  return { label: "标准身高", short: "标准" };
}

function weightLabel(bmi: number): string {
  if (bmi < 18.5) return "偏瘦";
  if (bmi < 24) return "标准体重";
  if (bmi < 28) return "偏胖";
  return "肥胖";
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [sitLong, setSitLong] = useState<boolean | null>(null);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summaryLines, setSummaryLines] = useState<string[]>([]);
  const [typedCount, setTypedCount] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

  function generateSummary(): string[] {
    if (!gender) return [];
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const bmi = w / ((h / 100) * (h / 100));
    const hRef = gender === "male" ? MALE_H : FEMALE_H;
    const bRef = gender === "male" ? MALE_BMI : FEMALE_BMI;
    const hPct = percentile(h, hRef.mean, hRef.sd);
    const bmiPct = percentile(bmi, bRef.mean, bRef.sd);
    const hInfo = heightLabel(hPct);
    const wLabel = weightLabel(bmi);
    const gLabel = gender === "male" ? "男性" : "女性";
    const pctDisplay = (hInfo.label === "迷你" || hInfo.label === "大高个") ? hPct.toFixed(3) : hPct.toFixed(1);

    const lines = [
      nickname + "，根据你的数据（" + gLabel + "，" + h + "cm / " + w + "kg），分析如下：",
      "身高在" + gLabel + "中超过 " + pctDisplay + "% 的人，属于「" + hInfo.label + "」。",
      "BMI 为 " + bmi.toFixed(1) + "，属于「" + wLabel + "」。",
      "体型结论：" + hInfo.short + "身高，" + wLabel + "体型。",
    ];

    if (bmi >= 28) lines.push("体重较大，需更强腰部支撑和偏硬网面坐垫，防止坐骨触底。");
    else if (bmi >= 24) lines.push("偏壮体型，建议腰部支撑较强、坐垫中等偏硬的椅子。");
    else if (bmi < 18.5) lines.push("偏瘦体型，肌肉量较低，建议坐垫偏软、腰撑力度柔和。");

    if (gender === "female") lines.push("女性腰椎曲度通常更大，建议腰撑位置可调、坐感偏软。");
    if (sitLong) lines.push("每天久坐超过6小时，颈部、肩部、腰部长期受压。强烈建议带头枕、多维扶手、强支撑腰靠的椅子。");
    else lines.push("久坐时间在6小时以内，标准配置工学椅即可满足需求。");

    lines.push("接下来，将根据你的身体数据和预算匹配最适合的椅子。");
    return lines;
  }

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 1 && !nickname.trim()) e.nickname = "请输入昵称";
    if (s === 2 && !gender) e.gender = "请选择性别";
    if (s === 3) { const h = parseFloat(height); if (!height || isNaN(h)) e.height = "请输入身高"; else if (h < 130 || h > 220) e.height = "130-220cm"; }
    if (s === 4) { const w = parseFloat(weight); if (!weight || isNaN(w)) e.weight = "请输入体重"; else if (w < 30 || w > 150) e.weight = "30-150kg"; }
    if (s === 5 && sitLong === null) e.sitLong = "请选择";
    if (s === 6) { const bMin = parseFloat(budgetMin); const bMax = parseFloat(budgetMax); if (!budgetMin || isNaN(bMin)) e.budgetMin = "请输入最低预算"; if (!budgetMax || isNaN(bMax)) e.budgetMax = "请输入最高预算"; else if (bMin >= bMax) e.budgetMax = "最高须大于最低"; }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) {
      if (step === 6) { setSummaryLines(generateSummary()); setTypedCount(0); setTypingDone(false); }
      setStep(step + 1);
    }
  }

  function handleSubmit() {
    const h = parseFloat(height); const w = parseFloat(weight);
    const bMin = parseFloat(budgetMin); const bMax = parseFloat(budgetMax);
    recordUsage({ nickname, gender, height: h, weight: w, sitLong: sitLong ?? false, budgetMin: bMin, budgetMax: bMax });
    router.push("/match?h=" + h + "&w=" + w + "&bmin=" + bMin + "&bmax=" + bMax + "&sit=" + (sitLong ? "1" : "0"));
  }

  useEffect(() => {
    if (step !== 7 || typingDone) return;
    if (typedCount < summaryLines.length) {
      const timer = setTimeout(() => setTypedCount(typedCount + 1), 750);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setTypingDone(true), 400);
      return () => clearTimeout(timer);
    }
  }, [step, typedCount, summaryLines, typingDone]);

  const pct = (step / TOTAL_STEPS) * 100;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-[#171717] leading-tight">
          找到适合你的工学椅
        </h1>
        <p className="text-sm text-[#a3a3a3] mt-1.5">野生的装机宅 · 智能匹配</p>
        <div className="progress-bar mt-5 mx-auto max-w-[200px]">
          <div className="progress-bar-fill" style={{ width: pct + "%" }} />
        </div>
        <p className="text-xs text-[#a3a3a3] mt-2">{step} / {TOTAL_STEPS}</p>
      </div>

      {/* Form area */}
      <div className="w-full min-h-[260px] flex flex-col justify-center" key={step}>
        {step === 1 && (
          <div className="animate-fade-up space-y-4">
            <label className="block text-lg font-semibold text-[#171717]">怎么称呼你？</label>
            <input type="text" value={nickname} onChange={e => { setNickname(e.target.value); setErrors({}); }} onKeyDown={e => e.key === "Enter" && next()}
              placeholder="输入昵称" autoFocus
              className="w-full px-4 py-3 rounded-xl border border-[#e5e5e5] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-shadow duration-200 placeholder:text-[#a3a3a3]" />
            {errors.nickname && <p className="text-red-500 text-xs">{errors.nickname}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up space-y-4">
            <label className="block text-lg font-semibold text-[#171717]">你的性别？</label>
            <p className="text-xs text-[#a3a3a3]">用于更精准的人体数据推算</p>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as const).map(k => (
                <button key={k} onClick={() => { setGender(k); setErrors({}); }}
                  className={"py-5 rounded-xl border-2 font-medium transition-all duration-200 pressable " + (gender === k ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]" : "border-[#e5e5e5] bg-white text-[#525252] hover:border-[#d4d4d4]")}>
                  <div className="text-xl">{k === "male" ? "男" : "女"}</div>
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up space-y-4">
            <label className="block text-lg font-semibold text-[#171717]">你的身高？</label>
            <div className="relative">
              <input type="number" inputMode="decimal" value={height} onChange={e => { setHeight(e.target.value); setErrors({}); }}
                onKeyDown={e => e.key === "Enter" && next()} placeholder="175" autoFocus
                className="w-full px-4 py-3 rounded-xl border border-[#e5e5e5] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent placeholder:text-[#a3a3a3]" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-sm">cm</span>
            </div>
            {errors.height && <p className="text-red-500 text-xs">{errors.height}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-up space-y-4">
            <label className="block text-lg font-semibold text-[#171717]">你的体重？</label>
            <div className="relative">
              <input type="number" inputMode="decimal" value={weight} onChange={e => { setWeight(e.target.value); setErrors({}); }}
                onKeyDown={e => e.key === "Enter" && next()} placeholder="70" autoFocus
                className="w-full px-4 py-3 rounded-xl border border-[#e5e5e5] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent placeholder:text-[#a3a3a3]" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-sm">kg</span>
            </div>
            {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-up space-y-4">
            <label className="block text-lg font-semibold text-[#171717]">每天坐姿超过6小时？</label>
            <p className="text-xs text-[#a3a3a3]">长时间久坐对椅子支撑要求更高</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ k: true, l: "是，超过6小时" }, { k: false, l: "否，6小时以内" }].map(o => (
                <button key={String(o.k)} onClick={() => { setSitLong(o.k); setErrors({}); }}
                  className={"py-5 rounded-xl border-2 font-medium transition-all duration-200 pressable " + (sitLong === o.k ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]" : "border-[#e5e5e5] bg-white text-[#525252] hover:border-[#d4d4d4]")}>
                  <div className="text-sm">{o.l}</div>
                </button>
              ))}
            </div>
            {errors.sitLong && <p className="text-red-500 text-xs">{errors.sitLong}</p>}
          </div>
        )}

        {step === 6 && (
          <div className="animate-fade-up space-y-4">
            <label className="block text-lg font-semibold text-[#171717]">你的预算范围？</label>
            <p className="text-xs text-[#a3a3a3]">帮你筛选价格合适的椅子</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-sm">-</span>
                <input type="number" inputMode="numeric" value={budgetMin} onChange={e => { setBudgetMin(e.target.value); setErrors({}); }}
                  placeholder="500" autoFocus
                  className="w-full pl-7 pr-3 py-3 rounded-xl border border-[#e5e5e5] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent placeholder:text-[#a3a3a3]" />
              </div>
              <span className="text-[#a3a3a3] font-medium">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] text-sm">-</span>
                <input type="number" inputMode="numeric" value={budgetMax} onChange={e => { setBudgetMax(e.target.value); setErrors({}); }}
                  placeholder="2000"
                  className="w-full pl-7 pr-3 py-3 rounded-xl border border-[#e5e5e5] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent placeholder:text-[#a3a3a3]" />
              </div>
            </div>
            {(errors.budgetMin || errors.budgetMax) && <p className="text-red-500 text-xs">{errors.budgetMin || errors.budgetMax}</p>}
          </div>
        )}

        {step === 7 && (
          <div className="animate-fade-up space-y-3">
            <label className="block text-lg font-semibold text-[#171717]">身体分析报告</label>
            <div className="bg-white border border-[#e5e5e5] rounded-xl p-5 min-h-[220px] space-y-2 text-sm leading-relaxed shadow-sm">
              {summaryLines.slice(0, typedCount).map((line, i) => (
                <p key={i} className="text-[#525252]" style={{ animation: "fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both", animationDelay: i * 0.05 + "s" }}>
                  {i === 0 ? <span className="font-semibold text-[#171717] text-base">{line}</span> : line}
                </p>
              ))}
              {!typingDone && <span className="inline-block w-0.5 h-4 bg-[#2563eb] ml-0.5 align-middle animate-pulse" />}
            </div>
            {typingDone && (
              <button onClick={handleSubmit}
                className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl text-base transition-all duration-200 pressable"
                style={{ animation: "fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
                我已了解，开始匹配
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 7 && (
        <div className="w-full mt-8 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-5 py-3 border border-[#e5e5e5] rounded-xl text-[#525252] font-medium hover:bg-[#f5f5f5] transition-colors duration-200 pressable">
              上一步
            </button>
          )}
          <button onClick={step === 6 ? next : next} className="flex-1 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl transition-colors duration-200 pressable">
            {step === 6 ? "生成身体报告" : "下一步"}
          </button>
        </div>
      )}

      <p className="mt-6 text-xs text-[#a3a3a3]">
        已收录 60 款工学椅 · <Link href="/admin" className="text-[#2563eb] hover:underline">公式管理</Link>
      </p>
    </main>
  );
}
