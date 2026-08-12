// ============================================================
// 工学椅产品爬虫 — 扒取各品牌产品参数 + 下载图片
// 用法: node scripts/scrape.js
// 依赖: playwright
// ============================================================

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// 图片保存根目录
const IMG_ROOT = "C:/Users/pyz/Desktop/椅子产品库/图片";

// ============ 产品清单（品牌 → 产品URL列表） ============
// 每个产品: { brand, name, url }
const PRODUCTS = [
  // 西昊 M57（苏宁参数页）
  { brand: "西昊", name: "西昊 M57", url: "https://m.suning.com/itemcanshu/0000000000/12409494367.html" },
  // 保友 金豪B2（苏宁参数页）
  { brand: "保友", name: "保友 金豪B2", url: "https://m.suning.com/itemcanshu/0000000000/12423046776.html" },
];

// ============ 参数提取辅助 ============

/** 从页面文本中提取数值范围，如 "44-52cm" → {min, max} */
function extractRange(text, keyword) {
  // 找包含关键词的句子，提取数字范围
  const regex = new RegExp(keyword + "[^\\d]{0,10}(\\d+(?:\\.\\d+)?)\\s*[-~到]\\s*(\\d+(?:\\.\\d+)?)");
  const m = text.match(regex);
  if (m) return { min: parseFloat(m[1]), max: parseFloat(m[2]) };
  const singleRegex = new RegExp(keyword + "[^\\d]{0,10}(\\d+(?:\\.\\d+)?)");
  const sm = text.match(singleRegex);
  if (sm) return { min: parseFloat(sm[1]), max: parseFloat(sm[1]) };
  return null;
}

/** 提取价格 */
function extractPrice(text) {
  const m = text.match(/[¥￥]\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

// ============ 主爬取逻辑 ============

async function scrapeProduct(browser, product) {
  console.log(`\n=== 爬取 ${product.brand} - ${product.name} ===`);
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    await page.goto(product.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000); // 等 JS 渲染

    // 调试：输出实际页面标题和最终URL
    const title = await page.title();
    const finalUrl = page.url();
    console.log("页面标题:", title);
    console.log("最终URL:", finalUrl);

    // 获取页面全文
    const text = await page.evaluate(() => document.body.innerText);
    console.log("页面文本长度:", text.length, "前200字:", text.slice(0, 200).replace(/\n/g, " "));

    // 提取参数
    const specs = {
      坐高: extractRange(text, "坐高|座高|座面高度"),
      坐深: extractRange(text, "坐深|座深"),
      坐宽: extractRange(text, "坐宽|座宽"),
      扶手高: extractRange(text, "扶手高"),
      头枕高: extractRange(text, "头枕高"),
      背高: extractRange(text, "背高|靠背高"),
      价格: extractPrice(text),
    };

    console.log("提取到参数:", JSON.stringify(specs, null, 2));

    // 提取主图 URL
    const imgUrls = await page.evaluate(() => {
      const urls = [];
      document.querySelectorAll("img").forEach(img => {
        const src = img.src;
        if (src && src.includes("img") && (src.includes("360buyimg") || src.includes("jd.com") || src.includes("alicdn") || src.includes("tbcdn"))) {
          urls.push(src);
        }
      });
      return urls.slice(0, 5);
    });
    console.log("找到图片:", imgUrls.length, "张");

    // 下载图片
    const brandDir = path.join(IMG_ROOT, product.brand);
    if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

    let downloaded = 0;
    for (let i = 0; i < imgUrls.length; i++) {
      try {
        const response = await page.request.get(imgUrls[i]);
        if (response.ok()) {
          const buffer = await response.body();
          const ext = imgUrls[i].match(/\.(jpg|jpeg|png)/i)?.[1] || "jpg";
          const filename = `${product.name.replace(/[^\w\u4e00-\u9fff]/g, "_")}_${i + 1}.${ext}`;
          fs.writeFileSync(path.join(brandDir, filename), buffer);
          downloaded++;
        }
      } catch (e) {
        // 跳过失败的图片
      }
    }
    console.log(`下载图片: ${downloaded} 张 → ${brandDir}`);

    return { ...product, specs, images: imgUrls.length, downloaded };
  } catch (e) {
    console.error(`❌ ${product.name} 爬取失败:`, e.message);
    return { ...product, error: e.message };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("=== 工学椅产品爬虫启动 ===\n");
  const browser = await chromium.launch({ headless: true });

  const results = [];
  for (const product of PRODUCTS) {
    const result = await scrapeProduct(browser, product);
    results.push(result);
  }

  await browser.close();

  // 输出 JSON
  const outputPath = "C:/Users/pyz/Desktop/椅子产品库/爬取结果.json";
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n=== 完成，结果保存到 ${outputPath} ===`);
}

main().catch(e => {
  console.error("爬虫运行失败:", e);
  process.exit(1);
});
