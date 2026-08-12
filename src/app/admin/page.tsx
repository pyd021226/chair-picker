"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DEFAULT_CONFIG, loadConfig, saveConfig, resetConfig, exportConfig, type FormulaConfig } from "@/engine/config";
import { calculateBodyDimensions } from "@/engine/formulas";
import { matchAllChairs } from "@/engine/matcher";
import { chairs } from "@/data/chairs";
import Link from "next/link";

type ConfigKey = keyof FormulaConfig;

export default function AdminPage() {
  const [config, setConfig] = useState<FormulaConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [testH, setTestH] = useState("175");
  const [testW, setTestW] = useState("70");
  const [activeTab, setActiveTab] = useState<"all" | "core" | "other">("core");
  const [saveMsg, setSaveMsg] = useState("");

  // 加载配置
  useEffect(() => {
    setConfig(loadConfig());
    setLoaded(true);
  }, []);

  // 更新单个值
  const update = useCallback((path: string[], value: number) => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as FormulaConfig;
      let obj: any = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  }, []);

  // 测试计算
  const H = parseFloat(testH) || 175;
  const W = parseFloat(testW) || 70;
  const body = useMemo(() => calculateBodyDimensions(H, W, config), [H, W, config]);
  const matches = useMemo(() => matchAllChairs(chairs, H, W, undefined, config), [H, W, config]);

  // 所有用到的字段
  const coreFields: { group: string; fields: { path: string[]; label: string; desc: string }[] }[] = [
    {
      group: "坐高 (Seat Height)",
      fields: [
        { path: ["seatHeight", "coefLow"], label: "标准系数下限", desc: "腘窝高/身高 下限" },
        { path: ["seatHeight", "coefHigh"], label: "标准系数上限", desc: "腘窝高/身高 上限" },
        { path: ["seatHeight", "shoeLow"], label: "鞋底最低(cm)", desc: "" },
        { path: ["seatHeight", "shoeHigh"], label: "鞋底最高(cm)", desc: "" },
        { path: ["seatHeight", "cylinderLow"], label: "气杆最大压缩(cm)", desc: "减项" },
        { path: ["seatHeight", "cylinderHigh"], label: "气杆最小压缩(cm)", desc: "减项" },
        { path: ["seatHeight", "tallThreshold"], label: "高个子阈值(cm)", desc: ">此值启用高系数" },
        { path: ["seatHeight", "tallCoefLow"], label: "高个系数下限", desc: "" },
        { path: ["seatHeight", "tallCoefHigh"], label: "高个系数上限", desc: "" },
      ],
    },
    {
      group: "坐深 (Seat Depth)",
      fields: [
        { path: ["seatDepth", "coefLow"], label: "标准系数下限", desc: "臀腘比下限" },
        { path: ["seatDepth", "coefHigh"], label: "标准系数上限", desc: "臀腘比上限" },
        { path: ["seatDepth", "postureMin"], label: "最小姿势调整(cm)", desc: "" },
        { path: ["seatDepth", "postureMax"], label: "最大姿势调整(cm)", desc: "" },
        { path: ["seatDepth", "gap"], label: "膝盖窝间距(cm)", desc: "黄金距离" },
        { path: ["seatDepth", "tallThreshold"], label: "高个子阈值", desc: "" },
        { path: ["seatDepth", "tallCoefLow"], label: "高个系数下限", desc: "" },
        { path: ["seatDepth", "tallCoefHigh"], label: "高个系数上限", desc: "" },
        { path: ["seatDepth", "shortThreshold"], label: "矮个子阈值", desc: "<此值启用矮系数" },
        { path: ["seatDepth", "shortCoefLow"], label: "矮个系数下限", desc: "" },
        { path: ["seatDepth", "shortCoefHigh"], label: "矮个系数上限", desc: "" },
        { path: ["seatDepth", "matchTwoThirdsRatio"], label: "2/3边界比例", desc: "坐深特殊匹配规则" },
      ],
    },
    {
      group: "坐宽 (Seat Width)",
      fields: [
        { path: ["seatWidth", "intercept"], label: "回归截距(mm)", desc: "B= 截距 + 系数H×H + 系数W×W" },
        { path: ["seatWidth", "coefH"], label: "身高系数", desc: "" },
        { path: ["seatWidth", "coefW"], label: "体重系数", desc: "" },
        { path: ["seatWidth", "activityLow"], label: "最小活动空间(cm)", desc: "" },
        { path: ["seatWidth", "activityHigh"], label: "最大活动空间(cm)", desc: "" },
        { path: ["seatWidth", "meshDeduction"], label: "网布椅扣减(cm)", desc: "网布翘边占用空间" },
        { path: ["seatWidth", "spongeDeduction"], label: "海绵椅扣减(cm)", desc: "" },
      ],
    },
    {
      group: "背高 (Back Height)",
      fields: [
        { path: ["backHeight", "coefLow"], label: "标准下限", desc: "" },
        { path: ["backHeight", "coefHigh"], label: "标准上限", desc: "" },
        { path: ["backHeight", "tallThreshold"], label: "高个阈值", desc: "" },
        { path: ["backHeight", "tallCoefLow"], label: "高个下限", desc: "" },
        { path: ["backHeight", "tallCoefHigh"], label: "高个上限", desc: "" },
        { path: ["backHeight", "shortThreshold"], label: "矮个阈值", desc: "" },
        { path: ["backHeight", "shortCoefLow"], label: "矮个下限", desc: "" },
        { path: ["backHeight", "shortCoefHigh"], label: "矮个上限", desc: "" },
      ],
    },
  ];

  const otherFields: { group: string; fields: { path: string[]; label: string; desc: string }[] }[] = [
    {
      group: "背宽 / 扶手高 / 扶手宽",
      fields: [
        { path: ["backWidth", "coef"], label: "背宽系数", desc: "H×此值" },
        { path: ["backWidth", "weightThreshold"], label: "背宽体重阈值(kg)", desc: ">此值加修正" },
        { path: ["backWidth", "weightBonus"], label: "背宽体重修正", desc: "每kg加cm" },
        { path: ["armrestHeight", "coefLow"], label: "扶手高系数下限", desc: "" },
        { path: ["armrestHeight", "coefHigh"], label: "扶手高系数上限", desc: "" },
        { path: ["armrestHeight", "offset"], label: "扶手高偏移(cm)", desc: "统一加值" },
        { path: ["armrestHeight", "tallThreshold"], label: "扶手高-高个阈值", desc: "" },
        { path: ["armrestWidth", "coefH"], label: "扶手宽-身高系数", desc: "" },
        { path: ["armrestWidth", "coefW"], label: "扶手宽-体重系数", desc: "" },
        { path: ["armrestWidth", "offset"], label: "扶手宽-偏移", desc: "" },
      ],
    },
    {
      group: "头枕 / 后仰 / 坐垫 / 腰撑",
      fields: [
        { path: ["headrest", "coefCenter"], label: "头枕中心系数", desc: "" },
        { path: ["headrest", "coefLow"], label: "头枕范围下限", desc: "" },
        { path: ["headrest", "coefHigh"], label: "头枕范围上限", desc: "" },
        { path: ["headrest", "tallThreshold"], label: "头枕-高个阈值", desc: "" },
        { path: ["headrest", "tallCenter"], label: "头枕-高个中心", desc: "" },
        { path: ["headrest", "shortThreshold"], label: "头枕-矮个阈值", desc: "" },
        { path: ["headrest", "shortCenter"], label: "头枕-矮个中心", desc: "" },
        { path: ["headrest", "needBase"], label: "头枕需求-基准(cm)", desc: "(H-b)/d" },
        { path: ["headrest", "needDivisor"], label: "头枕需求-除数", desc: "" },
        { path: ["reclineTension", "divisor"], label: "后仰力度除数", desc: "W×H/此值" },
        { path: ["reclineTension", "tallWeightMultiplier"], label: "后仰-高个体重修正", desc: "" },
        { path: ["reclineTension", "shortWeightMultiplier"], label: "后仰-矮个体重修正", desc: "" },
        { path: ["seatFirmness", "base"], label: "坐垫硬度-基准(kg)", desc: "(W-b)/d" },
        { path: ["seatFirmness", "divisor"], label: "坐垫硬度-除数", desc: "" },
        { path: ["lumbarTension", "base"], label: "腰撑力度-基准(kg)", desc: "" },
        { path: ["lumbarTension", "divisor"], label: "腰撑力度-除数", desc: "" },
        { path: ["lumbarPosition", "coef"], label: "腰撑位置系数", desc: "H×此值" },
        { path: ["lumbarPosition", "tallThreshold"], label: "腰撑-高个阈值", desc: "" },
        { path: ["lumbarPosition", "tallCoef"], label: "腰撑-高个系数", desc: "" },
        { path: ["lumbarPosition", "shortThreshold"], label: "腰撑-矮个阈值", desc: "" },
        { path: ["lumbarPosition", "shortCoef"], label: "腰撑-矮个系数", desc: "" },
        { path: ["lumbarDepth", "base"], label: "腰撑深度-基准(cm)", desc: "" },
        { path: ["lumbarDepth", "weightThreshold"], label: "腰撑深度-体重阈值", desc: "" },
        { path: ["lumbarDepth", "weightMultiplier"], label: "腰撑深度-体重修正", desc: "" },
      ],
    },
  ];

  const visibleFields = activeTab === "all"
    ? [...coreFields, ...otherFields]
    : activeTab === "core" ? coreFields : otherFields;

  if (!loaded) return <div className="p-8 text-neutral-400">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">⚙️ 公式系数管理</h1>
          <p className="text-xs text-neutral-400 mt-1">调整后点击「保存」生效，所有使用该工具的用户都会看到新结果</p>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 回首页</Link>
      </div>

      {/* 测试区 */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 sticky top-4 z-10 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-neutral-600">快速测试：</span>
          <input type="number" value={testH} onChange={(e) => setTestH(e.target.value)}
            className="w-20 px-3 py-2 border rounded-lg text-sm" placeholder="175" />
          <span className="text-neutral-400 text-sm">cm</span>
          <input type="number" value={testW} onChange={(e) => setTestW(e.target.value)}
            className="w-20 px-3 py-2 border rounded-lg text-sm" placeholder="70" />
          <span className="text-neutral-400 text-sm">kg</span>
          <span className="text-neutral-300">|</span>
          <span className="text-sm">
            坐高 <b className="text-blue-600">{body.seatHeight.min}-{body.seatHeight.max}cm</b>
          </span>
          <span className="text-sm">
            坐深 <b className="text-blue-600">{body.seatDepth.min}-{body.seatDepth.max}cm</b>
          </span>
          <span className="text-sm">
            坐宽 <b className="text-blue-600">{body.seatWidth}cm</b>
          </span>
          <span className="text-sm">
            Top1: <b className="text-green-600">{matches[0]?.chair.name.slice(0, 12)}</b>
            {" "}({matches[0]?.overallScore}%)
          </span>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "core", label: "核心尺寸（坐高/深/宽/背高）" },
          { key: "other", label: "其他维度（扶手/头枕/腰撑…）" },
          { key: "all", label: "全部" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 系数编辑 */}
      <div className="space-y-6 mb-8">
        {visibleFields.map((group) => (
          <div key={group.group} className="border border-neutral-200 rounded-xl overflow-hidden">
            <h3 className="px-4 py-2.5 bg-neutral-50 text-sm font-semibold text-neutral-700 border-b border-neutral-100">
              {group.group}
            </h3>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.fields.map((field) => {
                let val: number = 0;
                try {
                  let obj: any = config;
                  for (const p of field.path) obj = obj[p];
                  val = obj;
                } catch { val = 0; }
                return (
                  <div key={field.path.join(".")} className="space-y-1">
                    <label className="text-[11px] text-neutral-500 block truncate" title={field.label}>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      step={field.path.some((p) => p.includes("Threshold")) ? "1" : "0.001"}
                      value={val}
                      onChange={(e) => update(field.path, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                    />
                    {field.desc && <span className="text-[10px] text-neutral-400">{field.desc}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mb-8 sticky bottom-4 bg-white/90 backdrop-blur p-4 rounded-xl border border-neutral-200 shadow-lg">
        <button
          onClick={() => { saveConfig(config); setSaveMsg("✅ 已保存！"); setTimeout(() => setSaveMsg(""), 2000); }}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm"
        >
          保存配置
        </button>
        <button
          onClick={() => { resetConfig(); setConfig(DEFAULT_CONFIG); setSaveMsg("✅ 已重置为默认值"); setTimeout(() => setSaveMsg(""), 2000); }}
          className="px-6 py-2.5 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition text-sm"
        >
          重置默认
        </button>
        <button
          onClick={() => exportConfig(config)}
          className="px-6 py-2.5 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition text-sm"
        >
          导出 JSON
        </button>
        <span className="text-sm text-green-600 self-center">{saveMsg}</span>
        <span className="text-[10px] text-neutral-400 self-center ml-auto">
          配置保存在浏览器 localStorage
        </span>
      </div>

      {/* 匹配预览 */}
      <details className="border border-neutral-200 rounded-xl overflow-hidden mb-8">
        <summary className="px-4 py-3 bg-neutral-50 cursor-pointer text-sm font-semibold text-neutral-700 hover:bg-neutral-100">
          📊 匹配结果预览（{testH}cm/{testW}kg — Top 10）
        </summary>
        <div className="p-4 space-y-1 text-sm">
          {matches.slice(0, 10).map((m, i) => (
            <div key={m.chair.id} className="flex items-center gap-3 py-1.5 border-b border-neutral-50 last:border-0">
              <span className="w-6 text-neutral-400 text-xs">#{i + 1}</span>
              <span className="flex-1 truncate">{m.chair.name}</span>
              <span className="w-16 text-right font-mono text-xs text-neutral-600">{m.chair.price ? `¥${m.chair.price}` : "-"}</span>
              <span className={`w-12 text-right font-bold text-sm ${m.overallScore >= 85 ? "text-green-600" : m.overallScore >= 70 ? "text-amber-600" : "text-red-500"}`}>
                {m.overallScore}%
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
