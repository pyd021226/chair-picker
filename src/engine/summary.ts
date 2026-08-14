// ============================================================
// 身体分析总结 — 纯函数，供首页问卷 + 报告页共用
// ============================================================

const MALE_H = { mean: 172.5, sd: 5.8 };
const FEMALE_H = { mean: 161.5, sd: 5.3 };
const MALE_BMI = { mean: 22.5, sd: 3.0 };
const FEMALE_BMI = { mean: 21.8, sd: 2.8 };

export function percentile(val: number, mean: number, sd: number): number {
  const z = (val - mean) / sd;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = 1 - d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const raw = z > 0 ? p : 1 - p;
  return Math.min(99.9, Math.max(0.1, Math.round(raw * 1000) / 10));
}

export function heightLabel(pct: number): { label: string; short: string } {
  if (pct >= 95) return { label: "大高个", short: "高" };
  if (pct >= 80) return { label: "高个子", short: "高" };
  if (pct >= 60) return { label: "中高", short: "中高" };
  if (pct <= 5) return { label: "迷你", short: "矮" };
  if (pct <= 20) return { label: "小个子", short: "矮" };
  if (pct <= 40) return { label: "中小个子", short: "中小" };
  return { label: "标准身高", short: "标准" };
}

export function weightLabel(bmi: number): string {
  if (bmi < 18.5) return "偏瘦";
  if (bmi < 24) return "标准体重";
  if (bmi < 28) return "偏胖";
  return "肥胖";
}

export interface SummaryInput {
  nickname: string;
  gender: "male" | "female";
  height: number;
  weight: number;
  sitLong: boolean;
  budgetMin?: number;
  budgetMax?: number;
}

/** 生成身体分析总结文案（结论 + 需求痛点） */
export function generateSummaryLines(input: SummaryInput): string[] {
  const { nickname, gender, height: h, weight: w, sitLong } = input;
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

  return lines;
}

/** 根据用户特征生成「方案思路」文案（不匹配具体椅子，只说思路） */
export function generatePlan(input: SummaryInput): string {
  const { gender, height: h, weight: w, sitLong } = input;
  const bmi = w / ((h / 100) * (h / 100));
  const hInfo = heightLabel(percentile(h, gender === "male" ? MALE_H.mean : FEMALE_H.mean, gender === "male" ? MALE_H.sd : FEMALE_H.sd));
  const wLabelStr = weightLabel(bmi);

  const parts: string[] = [];
  parts.push("优先保证「坐高、坐深、坐宽」三个核心尺寸完全落在适配范围内");
  if (bmi >= 24) parts.push("重点看腰部支撑是否够强、坐垫是否偏硬（避免坐骨触底）");
  else if (bmi < 18.5) parts.push("重点看坐垫是否偏软、腰撑力度是否柔和");
  if (gender === "female") parts.push("关注腰撑位置是否可调、坐感是否偏软");
  if (sitLong) parts.push("优先选带头枕、多维扶手、强腰靠的配置");
  parts.push("预算" + (input.budgetMin && input.budgetMax ? " ¥" + input.budgetMin + "–¥" + input.budgetMax : "范围内") + " 内，选做工扎实、售后靠谱的品牌");

  return "针对「" + hInfo.short + "身高 · " + wLabelStr + "」的体型" + (gender === "female" ? "与女性腰椎特点" : "") + "，我们的方案思路是：" + parts.join("；") + "。";
}
