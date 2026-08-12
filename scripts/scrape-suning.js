// ============================================================
// 苏宁工学椅爬虫 — 下载产品全部图片（含尺寸标注详情图）
// 用法: node scripts/scrape-suning.js
// ============================================================

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const IMG_ROOT = "C:/Users/pyz/Desktop/椅子产品库/图片";

// ============ 产品清单：品牌 → 苏宁 product 页 URL ============
const PRODUCTS = [
  { brand: "西昊", name: "西昊 M57", url: "https://m.suning.com/product/0000000000/12409494367.html" },
  { brand: "保友", name: "保友 金豪B2", url: "https://m.suning.com/product/0000000000/12423046776.html" },
];

/** 去掉尺寸后缀，得到原图 URL */
function fullRes(url) {
  return url.replace(/_\d+w_\d+h_\d+e_\d+Q.*$/, "").replace(/_\d+w_\d+h.*$/, "");
}

async function scrapeProduct(browser, product) {
  console.log(`\n=== ${product.brand} - ${product.name} ===`);
  const page = await browser.newPage({ viewport: { width: 750, height: 1200 } });
  page.setDefaultTimeout(30000);

  try {
    await page.goto(product.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    // 滚动到底加载懒加载图片（详情图通常很长，需要多滚）
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 2500));
      await page.waitForTimeout(600);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    // 收集所有图片（含懒加载 data-* 属性）
    const rawUrls = await page.evaluate(() => {
      const set = new Set();
      document.querySelectorAll("img").forEach(img => {
        const src = img.src || img.getAttribute("data-original") || img.getAttribute("data-src") || img.getAttribute("data-lazyload") || "";
        if (src && src.includes("imgservice.suning.cn")) set.add(src);
      });
      return [...set];
    });

    // 转全分辨率 + 去重
    const fullUrls = [...new Set(rawUrls.map(fullRes))];
    console.log("找到图片:", fullUrls.length, "张");

    const brandDir = path.join(IMG_ROOT, product.brand, product.name.replace(/[^\w\u4e00-\u9fff]/g, "_"));
    if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

    let downloaded = 0;
    for (let i = 0; i < fullUrls.length; i++) {
      try {
        const resp = await page.request.get(fullUrls[i]);
        if (resp.ok()) {
          const buffer = await resp.body();
          // 只保存 >10KB 的图（过滤掉图标/logo）
          if (buffer.length > 10000) {
            const ext = fullUrls[i].match(/\.(jpg|jpeg|png)/i)?.[1] || "jpg";
            fs.writeFileSync(path.join(brandDir, `${i + 1}.${ext}`), buffer);
            downloaded++;
          }
        }
      } catch (e) { /* 跳过 */ }
    }
    console.log(`下载 ${downloaded} 张 → ${brandDir}`);
    return { ...product, total: fullUrls.length, downloaded };
  } catch (e) {
    console.error(`❌ ${product.name} 失败:`, e.message);
    return { ...product, error: e.message };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("=== 苏宁工学椅图片爬虫 ===\n");
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const p of PRODUCTS) results.push(await scrapeProduct(browser, p));
  await browser.close();
  fs.writeFileSync("C:/Users/pyz/Desktop/椅子产品库/图片爬取结果.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("\n=== 完成 ===");
}

main().catch(e => { console.error(e); process.exit(1); });
