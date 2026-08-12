// ============================================================
// 数据清洗脚本：Excel → 结构化 TypeScript
// 用法: npx tsx scripts/clean-data.ts
// ============================================================

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// ---- 解析工具 ----

/** 提取数值范围 "44-52.5cm" → {min:44, max:52.5}，失败返回 null */
function parseRange(raw: string | number | null | undefined): { min: number; max: number } | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim();
  // 去掉 "cm" 单位
  const clean = s.replace(/cm/gi, "").trim();
  // 尝试匹配 "44-52.5" 或 "44~52.5"
  const rangeMatch = clean.match(/^([\d.]+)\s*[-~]\s*([\d.]+)/);
  if (rangeMatch) {
    return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
  }
  // 尝试匹配单个数字 "52"
  const singleMatch = clean.match(/^([\d.]+)/);
  if (singleMatch) {
    const v = parseFloat(singleMatch[1]);
    return { min: v, max: v };
  }
  return null;
}

/** 从文本中提取单个数值 */
function parseNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim();
  const match = s.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/** 解析价格 "¥1059" → 1059 */
function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim();
  // 去掉 ¥ 和 ￥
  const clean = s.replace(/[¥￥]/g, "").trim();
  const match = clean.match(/([\d.]+)/);
  if (match) {
    const v = parseFloat(match[1]);
    return v > 0 ? v : null;
  }
  return null;
}

/** 识别材质 */
function parseSurface(raw: string | number | null | undefined): "mesh" | "sponge" | "leather" | "fabric" | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (s.includes("网") || s.includes("mesh")) return "mesh";
  if (s.includes("海绵") || s.includes("软包") || s.includes("皮质") || s.includes("sponge")) return "sponge";
  if (s.includes("真皮") || s.includes("leather") || s.includes("皮")) return "leather";
  if (s.includes("布") || s.includes("fabric")) return "fabric";
  return null;
}

/** 从文本判断测量基准 */
function detectMeasureBase(raw: string | number | null | undefined): "floor" | "seat" | null {
  if (!raw) return null;
  const s = String(raw);
  if (s.includes("从地面") || s.includes("地面量起")) return "floor";
  if (s.includes("距座面")) return "seat";
  return null;
}

/** 从功能描述提取是否可调 */
function isAdjustable(funcStr: string | null): boolean {
  if (!funcStr) return false;
  return funcStr.includes("可调") || funcStr.includes("升降") || funcStr.includes("调节");
}

/** 生成 slug ID */
function slugify(brand: string, name: string): string {
  const base = name
    .replace(/[^\w\u4e00-\u9fff]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const brandSlug = brand.toLowerCase().replace(/\s+/g, "-");
  return `${brandSlug}-${base}`.slice(0, 80);
}

// ---- 主清洗逻辑 ----

function cleanData() {
  const excelPath = path.resolve("C:/Users/pyz/Desktop/数据集/工学椅产品尺寸数据集.xlsx");
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // 跳过表头行
  const dataRows = rows.slice(1).filter((row) => {
    // 过滤空行
    return row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== "");
  });

  const chairs: any[] = [];
  const seenModels = new Map<string, any>(); // 用于合并颜色变体

  for (const row of dataRows) {
    const [
      brand, name, sku,
      rawSeatHeight, rawSeatDepth, rawSeatWidth,
      rawLumbarW, rawLumbarH, rawLumbarFunc,
      rawBackHeight, rawBackWidth,
      rawTotalHeight,
      rawArmHeight, rawArmWidth, rawArmFunc,
      rawHeadH, rawHeadW, rawHeadFunc,
      rawGas, rawBaseMaterial, rawSurface,
      rawPrice, rawPriceFoot,
      rawRecline, rawBaseType,
    ] = row;

    if (!name || String(name).trim() === "") continue;

    const brandStr = String(brand || "").trim();
    const nameStr = String(name).trim();
    const id = slugify(brandStr, nameStr);

    // 解析数值
    const seatHeight = parseRange(rawSeatHeight);
    const seatDepth = parseRange(rawSeatDepth);
    const seatWidth = parseNumber(rawSeatWidth);
    const backHeight = parseRange(rawBackHeight);
    const backWidth = parseNumber(rawBackWidth);
    const lumbarWidth = parseNumber(rawLumbarW);
    const lumbarHeight = parseNumber(rawLumbarH);
    const armHeight = parseRange(rawArmHeight);
    const armWidth = parseNumber(rawArmWidth);
    const headHeight = parseRange(rawHeadH);
    const headWidth = parseNumber(rawHeadW);
    const totalHeight = parseRange(rawTotalHeight);

    const surface = parseSurface(rawSurface);
    const price = parsePrice(rawPrice);
    const priceFoot = parsePrice(rawPriceFoot);

    // 有效坐宽：网布减5cm，海绵减1cm
    const seatWidthEffective = seatWidth !== null
      ? surface === "mesh" ? seatWidth - 5
      : surface === "sponge" ? seatWidth - 1
      : seatWidth
      : null;

    const chair = {
      id,
      brand: brandStr,
      name: nameStr,
      sku: sku ? String(sku).trim() : null,
      price,
      priceWithFootrest: priceFoot,
      surface,

      seatHeight,
      seatDepth,
      seatWidth,
      seatWidthEffective,

      backHeight,
      backWidth,
      lumbarWidth,
      lumbarHeight,
      lumbarFunc: rawLumbarFunc ? String(rawLumbarFunc).trim() : null,
      lumbarDepth: null,
      lumbarAdjustable: isAdjustable(rawLumbarFunc ? String(rawLumbarFunc) : null),

      armrestHeight: armHeight,
      armrestWidth: armWidth,
      armrestFunc: rawArmFunc ? String(rawArmFunc).trim() : null,

      headrestHeight: headHeight,
      headrestWidth: headWidth,
      headrestFunc: rawHeadFunc ? String(rawHeadFunc).trim() : null,
      headrestAdjustable: detectMeasureBase(rawHeadH) === null && headHeight !== null && headHeight.min !== headHeight.max,

      totalHeight,
      reclineAngle: rawRecline ? String(rawRecline).trim() : null,
      reclineTensionAdjustable: false,
      baseType: rawBaseType ? String(rawBaseType).trim() : null,
      gasCylinder: rawGas ? String(rawGas).trim() : null,
      baseMaterial: rawBaseMaterial ? String(rawBaseMaterial).trim() : null,
      maxWeight: null,

      tags: [] as string[],
    };

    // 生成标签
    if (surface === "mesh") chair.tags.push("网布");
    if (surface === "sponge") chair.tags.push("海绵");
    if (surface === "leather") chair.tags.push("真皮");
    if (chair.lumbarFunc && chair.lumbarFunc.includes("多维")) chair.tags.push("多维护腰");
    if (chair.lumbarFunc && chair.lumbarFunc.includes("AI")) chair.tags.push("AI追腰");
    if (chair.armrestFunc && chair.armrestFunc.includes("D")) chair.tags.push("多维扶手");
    if (chair.headrestFunc) chair.tags.push("带头枕");
    if (chair.reclineAngle && parseNumber(chair.reclineAngle)) {
      const angle = parseNumber(chair.reclineAngle)!;
      if (angle >= 140) chair.tags.push("大角度后仰");
    }
    if (price !== null && price < 600) chair.tags.push("入门款");
    if (price !== null && price >= 600 && price < 1500) chair.tags.push("中端");
    if (price !== null && price >= 1500) chair.tags.push("高端");

    chairs.push(chair);
  }

  // 输出 TypeScript 文件
  const outputPath = path.resolve("src/data/chairs.ts");
  const ts = `// 自动生成于 ${new Date().toISOString().split("T")[0]}
// 数据来源：工学椅产品尺寸数据集.xlsx
// 共 ${chairs.length} 款椅子

import type { Chair } from "@/engine/types";

export const chairs: Chair[] = ${JSON.stringify(chairs, null, 2)};

export function getChairById(id: string): Chair | undefined {
  return chairs.find((c) => c.id === id);
}

export function getChairsByBrand(brand: string): Chair[] {
  return chairs.filter((c) => c.brand === brand);
}
`;

  fs.writeFileSync(outputPath, ts, "utf-8");
  console.log(`✅ 清洗完成: ${chairs.length} 款椅子 → ${outputPath}`);

  // 输出统计
  const brands = [...new Set(chairs.map((c) => c.brand))];
  console.log(`   品牌: ${brands.join(", ")}`);
  const withPrice = chairs.filter((c) => c.price !== null).length;
  const withSeatHeight = chairs.filter((c) => c.seatHeight !== null).length;
  const withSeatDepth = chairs.filter((c) => c.seatDepth !== null).length;
  const withSeatWidth = chairs.filter((c) => c.seatWidth !== null).length;
  console.log(`   有价格: ${withPrice}/${chairs.length}`);
  console.log(`   有坐高: ${withSeatHeight}/${chairs.length}`);
  console.log(`   有坐深: ${withSeatDepth}/${chairs.length}`);
  console.log(`   有坐宽: ${withSeatWidth}/${chairs.length}`);

  // 输出缺少核心数据的椅子
  const missingCore = chairs.filter((c) => !c.seatHeight && !c.seatDepth);
  if (missingCore.length > 0) {
    console.log(`\n⚠️  缺少坐高和坐深数据的椅子:`);
    missingCore.forEach((c) => console.log(`   - ${c.brand} ${c.name}`));
  }
}

cleanData();
