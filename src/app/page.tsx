"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recordUsage } from "@/engine/storage";

const TOTAL_STEPS = 6;

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

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 1 && !nickname.trim()) e.nickname = "请输入昵称";
    if (s === 2 && !gender) e.gender = "请选择性别";
    if (s === 3) {
      const h = parseFloat(height);
      if (!height || isNaN(h)) e.height = "请输入身高";
      else if (h < 130 || h > 220) e.height = "130-220cm";
    }
    if (s === 4) {
      const w = parseFloat(weight);
      if (!weight || isNaN(w)) e.weight = "请输入体重";
      else if (w < 30 || w > 150) e.weight = "30-150kg";
    }
    if (s === 5 && sitLong === null) e.sitLong = "请选择";
    if (s === 6) {
      const bMin = parseFloat(budgetMin);
      const bMax = parseFloat(budgetMax);
      if (!budgetMin || isNaN(bMin)) e.budgetMin = "请输入最低预算";
      if (!budgetMax || isNaN(bMax)) e.budgetMax = "请输入最高预算";
      else if (bMin >= bMax) e.budgetMax = "最高预算须大于最低";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep(step + 1);
  }

  function handleSubmit() {
    if (!validateStep(6)) return;
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const bMin = parseFloat(budgetMin);
    const bMax = parseFloat(budgetMax);
    // 记录使用数据
    recordUsage({ nickname, gender, height: h, weight: w, sitLong: sitLong ?? false, budgetMin: bMin, budgetMax: bMax });
    router.push(`/match?h=${h}&w=${w}&bmin=${bMin}&bmax=${bMax}&sit=${sitLong ? "1" : "0"}`);
  }

  function progress() {
    return (step / TOTAL_STEPS) * 100;
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold mb-1">🪑 找到你的工学椅</h1>
      <p className="text-sm text-neutral-400 mb-6">野生的装机宅 · 智能匹配</p>

      {/* 进度条 */}
      <div className="w-full h-1.5 bg-neutral-100 rounded-full mb-8">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress()}%` }} />
      </div>
      <div className="text-xs text-neutral-400 mb-6">第 {step} / {TOTAL_STEPS} 步</div>

      <div className="w-full min-h-[240px] flex flex-col justify-center">
        {/* Step 1: 昵称 */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-neutral-800">怎么称呼你？</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); if (errors.nickname) setErrors({}); }}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="输入昵称"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.nickname && <p className="text-red-500 text-xs">{errors.nickname}</p>}
          </div>
        )}

        {/* Step 2: 性别 */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-neutral-800">你的性别？</label>
            <p className="text-xs text-neutral-400">用于更精准的人体数据推算</p>
            <div className="flex gap-3">
              {[
                { key: "male" as const, label: "🙋 男", desc: "男性" },
                { key: "female" as const, label: "🙋‍♀️ 女", desc: "女性" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setGender(opt.key); setErrors({}); }}
                  className={`flex-1 py-4 rounded-xl border-2 text-center font-medium transition-all ${
                    gender === opt.key
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  <div className="text-lg">{opt.label}</div>
                  <div className="text-xs mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
          </div>
        )}

        {/* Step 3: 身高 */}
        {step === 3 && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-neutral-800">你的身高？</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={height}
                onChange={(e) => { setHeight(e.target.value); if (errors.height) setErrors({}); }}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="175"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">cm</span>
            </div>
            {errors.height && <p className="text-red-500 text-xs">{errors.height}</p>}
          </div>
        )}

        {/* Step 4: 体重 */}
        {step === 4 && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-neutral-800">你的体重？</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => { setWeight(e.target.value); if (errors.weight) setErrors({}); }}
                onKeyDown={(e) => e.key === "Enter" && next()}
                placeholder="70"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">kg</span>
            </div>
            {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
          </div>
        )}

        {/* Step 5: 坐姿时间 */}
        {step === 5 && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-neutral-800">每天坐姿超过 6 小时？</label>
            <p className="text-xs text-neutral-400">长时间久坐对椅子支撑要求更高</p>
            <div className="flex gap-3">
              {[
                { key: true, label: "✅ 是", desc: "超过6小时" },
                { key: false, label: "❌ 否", desc: "6小时以内" },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  onClick={() => { setSitLong(opt.key); setErrors({}); }}
                  className={`flex-1 py-4 rounded-xl border-2 text-center font-medium transition-all ${
                    sitLong === opt.key
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  <div className="text-lg">{opt.label}</div>
                  <div className="text-xs mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
            {errors.sitLong && <p className="text-red-500 text-xs">{errors.sitLong}</p>}
          </div>
        )}

        {/* Step 6: 预算区间 */}
        {step === 6 && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-neutral-800">你的预算范围？</label>
            <p className="text-xs text-neutral-400">帮你筛选价格合适的椅子</p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">¥</span>
                <input
                  type="number" inputMode="numeric"
                  value={budgetMin}
                  onChange={(e) => { setBudgetMin(e.target.value); if (errors.budgetMin) setErrors({}); }}
                  placeholder="500"
                  autoFocus
                  className="w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-200 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-neutral-400 font-medium">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">¥</span>
                <input
                  type="number" inputMode="numeric"
                  value={budgetMax}
                  onChange={(e) => { setBudgetMax(e.target.value); if (errors.budgetMax) setErrors({}); }}
                  placeholder="2000"
                  className="w-full pl-7 pr-3 py-3 rounded-xl border border-neutral-200 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {(errors.budgetMin || errors.budgetMax) && (
              <p className="text-red-500 text-xs">{errors.budgetMin || errors.budgetMax}</p>
            )}
          </div>
        )}
      </div>

      {/* 按钮 */}
      <div className="w-full mt-8 flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="px-5 py-3 border border-neutral-200 rounded-xl text-neutral-600 font-medium hover:bg-neutral-50 transition-colors">
            ← 上一步
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button onClick={next} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            下一步
          </button>
        ) : (
          <button onClick={handleSubmit} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
            🔍 开始匹配
          </button>
        )}
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        已收录 36 款工学椅 ·{" "}
        <Link href="/admin" className="text-blue-500 hover:underline">⚙️ 公式管理</Link>
      </p>
    </main>
  );
}
