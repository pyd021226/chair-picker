"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DEFAULT_CONFIG, loadConfig, saveConfig, resetConfig, exportConfig, type FormulaConfig } from "@/engine/config";
import { calculateBodyDimensions } from "@/engine/formulas";
import { matchAllChairs } from "@/engine/matcher";
import { chairs } from "@/data/chairs";
import Link from "next/link";

export default function AdminPage() {
  const [config, setConfig] = useState<FormulaConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [testH, setTestH] = useState("175");
  const [testW, setTestW] = useState("70");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => { setConfig(loadConfig()); setLoaded(true); }, []);

  const H = parseFloat(testH) || 175;
  const W = parseFloat(testW) || 70;
  const body = useMemo(() => calculateBodyDimensions(H, W, config), [H, W, config]);
  const matches = useMemo(() => matchAllChairs(chairs, H, W, undefined, config), [H, W, config]);

  const set = useCallback((group: string, key: string, value: number) => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[group][key] = value;
      return next;
    });
  }, []);

  const handleSave = () => { saveConfig(config); setSaveMsg("✅ 已保存！刷新页面生效"); setTimeout(() => setSaveMsg(""), 3000); };
  const handleReset = () => { resetConfig(); setConfig(DEFAULT_CONFIG); setSaveMsg("已重置"); setTimeout(() => setSaveMsg(""), 2000); };
  const handleExport = () => exportConfig(config);

  // 简化的参数列表：每组只暴露最关键的系数
  const groups: { key: string; title: string; fields: { key: string; label: string; min: number; max: number; step: number }[] }[] = [
    {
      key: "seatHeight", title: "🪑 坐高",
      fields: [
        { key: "coefLow", label: "腘窝比下限", min: 0.20, max: 0.30, step: 0.001 },
        { key: "coefHigh", label: "腘窝比上限", min: 0.20, max: 0.30, step: 0.001 },
        { key: "tallThreshold", label: "高个阈值(cm)", min: 175, max: 200, step: 1 },
        { key: "tallCoefLow", label: "高个系数下限", min: 0.20, max: 0.35, step: 0.001 },
        { key: "tallCoefHigh", label: "高个系数上限", min: 0.20, max: 0.35, step: 0.001 },
      ],
    },
    {
      key: "seatDepth", title: "📏 坐深",
      fields: [
        { key: "coefLow", label: "臀腘比下限", min: 0.20, max: 0.35, step: 0.001 },
        { key: "coefHigh", label: "臀腘比上限", min: 0.20, max: 0.35, step: 0.001 },
        { key: "shortThreshold", label: "矮个阈值(cm)", min: 145, max: 170, step: 1 },
        { key: "shortCoefLow", label: "矮个系数下限", min: 0.20, max: 0.30, step: 0.001 },
        { key: "tallThreshold", label: "高个阈值(cm)", min: 175, max: 200, step: 1 },
        { key: "tallCoefHigh", label: "高个系数上限", min: 0.20, max: 0.35, step: 0.001 },
      ],
    },
    {
      key: "seatWidth", title: "📐 坐宽",
      fields: [
        { key: "coefH", label: "身高系数", min: 1.0, max: 2.5, step: 0.01 },
        { key: "coefW", label: "体重系数", min: 0.5, max: 2.0, step: 0.01 },
        { key: "meshDeduction", label: "网布扣减(cm)", min: 1, max: 10, step: 0.5 },
        { key: "spongeDeduction", label: "海绵扣减(cm)", min: 0, max: 5, step: 0.5 },
      ],
    },
    {
      key: "backHeight", title: "🔙 背高",
      fields: [
        { key: "coefLow", label: "系数下限", min: 0.25, max: 0.45, step: 0.001 },
        { key: "coefHigh", label: "系数上限", min: 0.25, max: 0.45, step: 0.001 },
      ],
    },
    {
      key: "armrestHeight", title: "💪 扶手高",
      fields: [
        { key: "coefLow", label: "肘高比下限", min: 0.10, max: 0.25, step: 0.001 },
        { key: "coefHigh", label: "肘高比上限", min: 0.10, max: 0.25, step: 0.001 },
        { key: "offset", label: "偏移量(cm)", min: 0, max: 5, step: 0.5 },
      ],
    },
    {
      key: "headrest", title: "🧠 头枕",
      fields: [
        { key: "coefCenter", label: "中心位置系数", min: 0.35, max: 0.55, step: 0.001 },
        { key: "needBase", label: "需求基准(cm)", min: 140, max: 170, step: 1 },
        { key: "needDivisor", label: "需求除数", min: 20, max: 50, step: 1 },
      ],
    },
    {
      key: "reclineTension", title: "🔄 后仰力度",
      fields: [
        { key: "divisor", label: "力度除数", min: 1000, max: 2500, step: 50 },
      ],
    },
    {
      key: "seatFirmness", title: "🛋️ 坐垫软硬",
      fields: [
        { key: "base", label: "基准体重(kg)", min: 20, max: 50, step: 1 },
        { key: "divisor", label: "硬度除数", min: 5, max: 15, step: 0.5 },
      ],
    },
    {
      key: "lumbarTension", title: "🦴 腰撑力度",
      fields: [
        { key: "base", label: "基准体重(kg)", min: 20, max: 50, step: 1 },
        { key: "divisor", label: "力度除数", min: 5, max: 15, step: 0.5 },
      ],
    },
  ];

  if (!loaded) return <div className="p-8 text-neutral-400">加载中...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">⚙️ 公式指令站</h1>
          <p className="text-xs text-neutral-400 mt-0.5">调整系数 → 实时预览 → 保存生效</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">💾 保存</button>
          <button onClick={handleReset} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm hover:bg-neutral-200">↺ 重置</button>
          <button onClick={handleExport} className="px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm hover:bg-neutral-200">📥 导出</button>
          <Link href="/" className="px-3 py-2 text-neutral-400 text-sm hover:text-neutral-600">← 回首页</Link>
        </div>
      </div>
      {saveMsg && <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{saveMsg}</div>}

      {/* 实时预览 */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 sticky top-2 z-10 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-neutral-600">测试：</span>
          <input type="number" value={testH} onChange={e => setTestH(e.target.value)} className="w-20 px-3 py-1.5 border rounded-lg text-sm" /> cm
          <input type="number" value={testW} onChange={e => setTestW(e.target.value)} className="w-20 px-3 py-1.5 border rounded-lg text-sm" /> kg
          <span className="text-neutral-300">|</span>
          <span className="text-xs">坐高 <b className="text-blue-600">{body.seatHeight.min}-{body.seatHeight.max}</b></span>
          <span className="text-xs">坐深 <b className="text-blue-600">{body.seatDepth.min}-{body.seatDepth.max}</b></span>
          <span className="text-xs">坐宽 <b className="text-blue-600">{body.seatWidth}</b></span>
          <span className="text-xs">背高 <b className="text-blue-600">{body.backHeight.min}-{body.backHeight.max}</b></span>
          <span className="text-neutral-300">|</span>
          <span className="text-xs">Top1: <b className="text-green-600">{matches[0]?.chair.name.slice(0, 10)}</b> {matches[0]?.overallScore}%</span>
        </div>
      </div>

      {/* 系数编辑 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => {
          const groupData = (config as any)[g.key] || {};
          return (
            <div key={g.key} className="border border-neutral-200 rounded-xl overflow-hidden">
              <h3 className="px-3 py-2 bg-neutral-50 text-sm font-semibold text-neutral-700 border-b">{g.title}</h3>
              <div className="p-3 space-y-2">
                {g.fields.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <label className="text-[11px] text-neutral-500 w-24 flex-shrink-0 truncate" title={f.label}>{f.label}</label>
                    <input
                      type="number" step={f.step} value={groupData[f.key] ?? 0}
                      onChange={e => set(g.key, f.key, parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1 border border-neutral-200 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 匹配预览 */}
      <details className="mt-6 border border-neutral-200 rounded-xl overflow-hidden">
        <summary className="px-4 py-3 bg-neutral-50 cursor-pointer text-sm font-semibold hover:bg-neutral-100">
          📊 匹配结果预览（{testH}cm/{testW}kg — Top 15）
        </summary>
        <div className="p-4 space-y-1 text-sm">
          {matches.slice(0, 15).map((m, i) => (
            <div key={m.chair.id} className="flex items-center gap-3 py-1 border-b border-neutral-50 last:border-0">
              <span className="w-6 text-xs text-neutral-400">#{i+1}</span>
              <span className="flex-1 truncate text-sm">{m.chair.name}</span>
              <span className="text-xs text-neutral-400">{m.chair.price ? `¥${m.chair.price}` : "-"}</span>
              <span className={`w-10 text-right font-bold text-sm ${m.overallScore>=85?"text-green-600":m.overallScore>=70?"text-amber-600":"text-red-500"}`}>{m.overallScore}%</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
