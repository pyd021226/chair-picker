"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DEFAULT_CONFIG, loadConfig, saveConfig, resetConfig, exportConfig, DEFAULT_MATCH_RULES, loadMatchRules, saveMatchRules, resetMatchRules, type FormulaConfig, type MatchRules } from "@/engine/config";
import { calculateBodyDimensions } from "@/engine/formulas";
import { matchAllChairs } from "@/engine/matcher";
import { chairs } from "@/data/chairs";
import { getUsageStats, clearUsageRecords, loadCustomChairs, addCustomChair, removeCustomChair } from "@/engine/storage";
import type { Chair } from "@/engine/types";
import Link from "next/link";

export default function AdminPage() {
  const [config, setConfig] = useState<FormulaConfig>(DEFAULT_CONFIG);
  const [rules, setRules] = useState<MatchRules>(DEFAULT_MATCH_RULES);
  const [loaded, setLoaded] = useState(false);
  const [testH, setTestH] = useState("175");
  const [testW, setTestW] = useState("70");
  const [saveMsg, setSaveMsg] = useState("");
  const [tab, setTab] = useState<"formula" | "rules" | "dashboard" | "addchair">("formula");

  useEffect(() => { setConfig(loadConfig()); setRules(loadMatchRules()); setLoaded(true); }, []);

  const H = parseFloat(testH) || 175;
  const W = parseFloat(testW) || 70;
  const body = useMemo(() => calculateBodyDimensions(H, W, config), [H, W, config]);
  const matches = useMemo(() => matchAllChairs(chairs, H, W, undefined, config, rules), [H, W, config, rules]);

  const set = useCallback((group: string, key: string, value: number) => {
    setConfig((prev) => { const next = JSON.parse(JSON.stringify(prev)); next[group][key] = value; return next; });
  }, []);

  const setRule = useCallback((key: string, value: number) => {
    setRules((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (key.includes(".")) { const [a, b] = key.split("."); next[a][b] = value; }
      else { next[key] = value; }
      return next;
    });
  }, []);

  const handleSave = () => { saveConfig(config); saveMatchRules(rules); setSaveMsg("✅ 已保存！"); setTimeout(() => setSaveMsg(""), 3000); };
  const handleReset = () => { resetConfig(); resetMatchRules(); setConfig(DEFAULT_CONFIG); setRules(DEFAULT_MATCH_RULES); setSaveMsg("已重置"); setTimeout(() => setSaveMsg(""), 2000); };
  const handleExport = () => exportConfig(config);

  // 简化的参数列表：每组只暴露最关键的系数
  const groups: { key: string; title: string; fields: { key: string; label: string; min: number; max: number; step: number }[] }[] = [
    {
      key: "seatHeight", title: "🪑 坐高",
      fields: [
        { key: "coefLow", label: "矮个(<165)下限", min: 0.20, max: 0.30, step: 0.001 },
        { key: "coefHigh", label: "矮个(<165)上限", min: 0.20, max: 0.30, step: 0.001 },
        { key: "shortThreshold", label: "矮个/中等分界(cm)", min: 155, max: 175, step: 1 },
        { key: "midThreshold", label: "中等/高个分界(cm)", min: 170, max: 195, step: 1 },
        { key: "midCoefLow", label: "中等(165-180)下限", min: 0.20, max: 0.30, step: 0.001 },
        { key: "midCoefHigh", label: "中等(165-180)上限", min: 0.20, max: 0.30, step: 0.001 },
        { key: "tallCoefLow", label: "高个(>180)下限", min: 0.20, max: 0.35, step: 0.001 },
        { key: "tallCoefHigh", label: "高个(>180)上限", min: 0.20, max: 0.35, step: 0.001 },
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
          <span className="text-xs">坐宽 <b className="text-blue-600">{body.seatWidth.min}-{body.seatWidth.max}</b></span>
          <span className="text-xs">背高 <b className="text-blue-600">{body.backHeight.min}-{body.backHeight.max}</b></span>
          <span className="text-neutral-300">|</span>
          <span className="text-xs">Top1: <b className="text-green-600">{matches[0]?.chair.name.slice(0, 10)}</b> {matches[0]?.overallScore}%</span>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("formula")} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "formula" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"}`}>📐 公式系数</button>
        <button onClick={() => setTab("rules")} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "rules" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"}`}>📋 匹配规则</button>
        <button onClick={() => setTab("dashboard")} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "dashboard" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"}`}>📊 数据看板</button>
        <button onClick={() => setTab("addchair")} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === "addchair" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"}`}>➕ 录入椅子</button>
      </div>

      {/* 系数编辑 */}
      {tab === "formula" && (
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
      )}

      {/* 规则编辑 */}
      {tab === "rules" && (
      <div className="space-y-4">
        <div className="border border-neutral-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">📊 评分阈值</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "goodThreshold", label: "优秀线", desc: "≥此值→绿色匹配", min: 0.7, max: 0.99, step: 0.01 },
              { key: "marginalThreshold", label: "及格线", desc: "≥此值→黄色尚可", min: 0.5, max: 0.9, step: 0.01 },
              { key: "noOverlapMaxCoverage", label: "无重叠上限", desc: "完全无重叠时最高分", min: 0.3, max: 0.8, step: 0.05 },
              { key: "noOverlapPenaltyRate", label: "无重叠扣分率", desc: "每单位偏差扣分", min: 0.1, max: 1.5, step: 0.1 },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] text-neutral-500 block">{f.label} <span className="text-neutral-300">({f.desc})</span></label>
                <input type="number" step={f.step} value={(rules as any)[f.key] ?? 0} onChange={e => setRule(f.key, parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border rounded text-sm font-mono mt-0.5" />
              </div>
            ))}
          </div>
        </div>
        <div className="border border-neutral-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">⚖️ 维度权重（越大越重要）</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "weights.seatHeight", label: "坐高" }, { key: "weights.seatDepth", label: "坐深" },
              { key: "weights.seatWidth", label: "坐宽" }, { key: "weights.backHeight", label: "背高" },
              { key: "weights.backWidth", label: "背宽" }, { key: "weights.armrestHeight", label: "扶手高" },
              { key: "weights.armrestWidth", label: "扶手宽" }, { key: "weights.headrestRange", label: "头枕范围" },
              { key: "weights.headrestNeed", label: "头枕需求" }, { key: "weights.reclineTension", label: "后仰力度" },
              { key: "weights.seatFirmness", label: "坐垫软硬" }, { key: "weights.lumbarTension", label: "腰撑力度" },
              { key: "weights.lumbarPosition", label: "腰撑位置" }, { key: "weights.lumbarDepth", label: "腰撑深度" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] text-neutral-500 block">{f.label}</label>
                <input type="number" step="1" min="0" max="30"
                  value={(() => { const [a, b] = f.key.split("."); return (rules as any)[a]?.[b] ?? 0; })()}
                  onChange={e => setRule(f.key, parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border rounded text-sm font-mono mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* 数据看板 */}
      {tab === "dashboard" && <DashboardTab />}

      {/* 录入椅子 */}
      {tab === "addchair" && <AddChairTab />}

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

// ====== 数据看板 ======
function DashboardTab() {
  const stats = getUsageStats();
  const customChairs = loadCustomChairs();

  if (stats.total === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <p className="text-4xl mb-3">📊</p>
        <p className="font-medium">暂无使用数据</p>
        <p className="text-xs mt-1">当用户通过首页表单使用工具后，数据会出现在这里</p>
      </div>
    );
  }

  const maxH = Math.max(...stats.heightDist.map(d => d.count), 1);
  const maxW = Math.max(...stats.weightDist.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-neutral-500">总使用次数</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.gender.male + stats.gender.female}</div>
          <div className="text-xs text-neutral-500">男女比 {stats.gender.male}:{stats.gender.female}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.sitLongPct}%</div>
          <div className="text-xs text-neutral-500">久坐超过6小时</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">¥{stats.budgetAvg}</div>
          <div className="text-xs text-neutral-500">平均预算</div>
        </div>
      </div>

      {/* 身高分布 */}
      <div className="border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">📏 身高分布（每5cm一组）</h3>
        <div className="space-y-1">
          {stats.heightDist.map(d => (
            <div key={d.label} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-right text-neutral-500">{d.label}cm</span>
              <div className="flex-1 h-5 bg-neutral-100 rounded relative">
                <div className="h-full bg-blue-400 rounded" style={{width: `${(d.count/maxH)*100}%`}}/>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-white text-[10px] font-medium">{d.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 体重分布 */}
      <div className="border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">⚖️ 体重分布（每5kg一组）</h3>
        <div className="space-y-1">
          {stats.weightDist.map(d => (
            <div key={d.label} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-right text-neutral-500">{d.label}kg</span>
              <div className="flex-1 h-5 bg-neutral-100 rounded relative">
                <div className="h-full bg-emerald-400 rounded" style={{width: `${(d.count/maxW)*100}%`}}/>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-white text-[10px] font-medium">{d.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 自定义椅子数量 */}
      <div className="border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-2">🪑 已录入自定义椅子</h3>
        <p className="text-2xl font-bold text-neutral-700">{customChairs.length} 把</p>
      </div>

      <button onClick={() => { if(confirm("确定清空所有使用数据？")) clearUsageRecords(); window.location.reload(); }}
        className="text-xs text-red-400 hover:text-red-600">清空使用数据</button>
    </div>
  );
}

// ====== 录入椅子 ======
function AddChairTab() {
  const [customChairs, setCustomChairs] = useState<Chair[]>([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    brand: "", name: "", price: "", seatHeightMin: "", seatHeightMax: "",
    seatDepthMin: "", seatDepthMax: "", seatWidth: "", surface: "mesh",
    headrestFunc: "", armrestFunc: "", lumbarFunc: "",
  });

  useEffect(() => { setCustomChairs(loadCustomChairs()); }, []);

  const handleAdd = () => {
    if (!form.brand || !form.name) { setMsg("品牌和名称必填"); return; }
    const shMin = parseFloat(form.seatHeightMin) || 0;
    const shMax = parseFloat(form.seatHeightMax) || shMin;
    const sdMin = parseFloat(form.seatDepthMin) || 0;
    const sdMax = parseFloat(form.seatDepthMax) || sdMin;
    const sw = parseFloat(form.seatWidth) || 0;
    const price = parseFloat(form.price) || null;

    const id = form.brand + "-" + form.name + "-" + Date.now();
    const newChair: Chair = {
      id: id.replace(/\s+/g, "-").toLowerCase(),
      brand: form.brand, name: form.name, sku: null, imageUrl: null,
      price, priceWithFootrest: null,
      surface: form.surface as any,
      seatHeight: shMin > 0 ? { min: shMin, max: shMax } : null,
      seatDepth: sdMin > 0 ? { min: sdMin, max: sdMax } : null,
      seatWidth: sw > 0 ? sw : null,
      seatWidthEffective: sw > 0 ? (form.surface === "mesh" ? sw - 5 : sw - 1) : null,
      backHeight: null, backWidth: null,
      lumbarWidth: null, lumbarHeight: null,
      lumbarFunc: form.lumbarFunc || null, lumbarDepth: null, lumbarAdjustable: !!(form.lumbarFunc && form.lumbarFunc.includes("可调")),
      armrestHeight: null, armrestWidth: null, armrestFunc: form.armrestFunc || null,
      headrestHeight: null, headrestWidth: null, headrestFunc: form.headrestFunc || null, headrestAdjustable: !!(form.headrestFunc && form.headrestFunc.includes("升降")),
      totalHeight: null, reclineAngle: null, reclineTensionAdjustable: false,
      baseType: null, gasCylinder: null, baseMaterial: null, maxWeight: null, tags: [],
    };
    addCustomChair(newChair);
    setCustomChairs(loadCustomChairs());
    setMsg("✅ 已添加！去匹配页刷新即可看到");
    setForm({ brand: "", name: "", price: "", seatHeightMin: "", seatHeightMax: "", seatDepthMin: "", seatDepthMax: "", seatWidth: "", surface: "mesh", headrestFunc: "", armrestFunc: "", lumbarFunc: "" });
  };

  const handleDelete = (id: string) => {
    removeCustomChair(id);
    setCustomChairs(loadCustomChairs());
    setMsg("已删除");
  };

  return (
    <div className="space-y-6">
      {/* 录入表单 */}
      <div className="border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">➕ 录入新椅子</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[11px] text-neutral-500">品牌 *</label><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder="如 黑白调" className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">产品名 *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="如 P2 Ultra" className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">价格 ¥</label><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="1059" className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">表面材质</label><select value={form.surface} onChange={e=>setForm({...form,surface:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5">
            <option value="mesh">网布</option><option value="sponge">海绵</option><option value="leather">真皮</option></select></div>
          <div><label className="text-[11px] text-neutral-500">坐高最小(cm)</label><input type="number" value={form.seatHeightMin} onChange={e=>setForm({...form,seatHeightMin:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">坐高最大(cm)</label><input type="number" value={form.seatHeightMax} onChange={e=>setForm({...form,seatHeightMax:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">坐深最小(cm)</label><input type="number" value={form.seatDepthMin} onChange={e=>setForm({...form,seatDepthMin:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">坐深最大(cm)</label><input type="number" value={form.seatDepthMax} onChange={e=>setForm({...form,seatDepthMax:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">坐宽(cm)</label><input type="number" value={form.seatWidth} onChange={e=>setForm({...form,seatWidth:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
        </div>
        <div className="grid grid-cols-1 gap-3 mt-3">
          <div><label className="text-[11px] text-neutral-500">头枕功能（如：升降3cm, 旋转30°）</label><input value={form.headrestFunc} onChange={e=>setForm({...form,headrestFunc:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">扶手功能（如：4D扶手：升降8cm, 前后5cm）</label><input value={form.armrestFunc} onChange={e=>setForm({...form,armrestFunc:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
          <div><label className="text-[11px] text-neutral-500">腰撑功能（如：4D腰托：上下5cm, 前后2cm）</label><input value={form.lumbarFunc} onChange={e=>setForm({...form,lumbarFunc:e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm mt-0.5"/></div>
        </div>
        <button onClick={handleAdd} className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">添加椅子</button>
        {msg && <p className={`text-xs mt-2 ${msg.includes("✅")?"text-green-600":"text-red-500"}`}>{msg}</p>}
      </div>

      {/* 已录入列表 */}
      {customChairs.length > 0 && (
        <div className="border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">📋 已录入 ({customChairs.length} 把)</h3>
          <div className="space-y-1">
            {customChairs.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span>{c.brand} {c.name}</span>
                <span className="text-xs text-neutral-400">{c.price ? `¥${c.price}` : "-"}</span>
                <button onClick={()=>handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
