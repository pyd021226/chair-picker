"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [errors, setErrors] = useState<{ height?: string; weight?: string }>({});

  function validate(): boolean {
    const errs: typeof errors = {};
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (!height || isNaN(h)) errs.height = "请输入身高";
    else if (h < 130 || h > 220) errs.height = "身高范围 130-220cm";

    if (!weight || isNaN(w)) errs.weight = "请输入体重";
    else if (w < 30 || w > 150) errs.weight = "体重范围 30-150kg";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const h = parseFloat(height);
    const w = parseFloat(weight);
    router.push(`/match?h=${h}&w=${w}`);
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto w-full">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          🪑 找到适合你的工学椅
        </h1>
        <p className="text-neutral-500 text-base leading-relaxed">
          输入身高体重，基于中国人人体数据标准，
          <br className="hidden sm:block" />
          科学匹配最适合你的椅子，告别凭感觉选购。
        </p>
        <p className="mt-3 text-sm text-blue-600 font-medium">
          野生的装机宅 · B站百万粉椅子评测
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="height" className="block text-sm font-medium text-neutral-600 mb-1.5">
              身高
            </label>
            <div className="relative">
              <input
                id="height"
                type="number"
                inputMode="decimal"
                placeholder="175"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  if (errors.height) setErrors((p) => ({ ...p, height: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-xl border text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.height ? "border-red-400" : "border-neutral-200"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 pointer-events-none">
                cm
              </span>
            </div>
            {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
          </div>

          <div className="flex-1">
            <label htmlFor="weight" className="block text-sm font-medium text-neutral-600 mb-1.5">
              体重
            </label>
            <div className="relative">
              <input
                id="weight"
                type="number"
                inputMode="decimal"
                placeholder="70"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (errors.weight) setErrors((p) => ({ ...p, weight: undefined }));
                }}
                className={`w-full px-4 py-3 rounded-xl border text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.weight ? "border-red-400" : "border-neutral-200"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400 pointer-events-none">
                kg
              </span>
            </div>
            {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-lg transition-colors cursor-pointer"
        >
          开始匹配
        </button>
      </form>

      {/* How it works */}
      <div className="mt-12 grid grid-cols-3 gap-4 text-center w-full">
        {[
          { step: "①", title: "输入身高体重", desc: "只需两项数据" },
          { step: "②", title: "推算身体尺寸", desc: "基于国标公式" },
          { step: "③", title: "智能匹配椅子", desc: "按贴合度排序" },
        ].map((item) => (
          <div key={item.step}>
            <div className="text-2xl mb-1">{item.step}</div>
            <div className="text-sm font-medium text-neutral-800">{item.title}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-neutral-400">已收录 36 款工学椅 · 持续更新中</p>
    </main>
  );
}
