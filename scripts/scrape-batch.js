// ============================================================
// 苏宁工学椅批量爬虫 — 下载主图 + 提取基础参数
// 用法: node scripts/scrape-batch.js
// ============================================================

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const IMG_ROOT = "C:/Users/pyz/Desktop/椅子产品库/图片";

// 品牌 → 苏宁商品链接列表
const BRANDS = [
  {
    brand: "西昊",
    products: [
      ["西昊 M57", "https://m.suning.com/product/0000000000/12429277366.html"],
      ["西昊 M57 灰框灰网", "https://m.suning.com/product/0000000000/12181650303.html"],
      ["西昊 M57 黑框灰网", "https://m.suning.com/product/0000000000/12431199971.html"],
    ],
  },
  {
    brand: "永艺",
    products: [
      ["永艺 M69pro", "https://product.suning.com/0010359562/000000012439988560.html"],
      ["永艺 Act100", "https://product.suning.com/0010359562/000000012443688969.html"],
      ["永艺 X3", "https://product.suning.com/0010359562/000000012440006647.html"],
      ["永艺 X3攀登者", "https://product.suning.com/0010359562/000000012443008631.html"],
      ["永艺 Flow550", "http://product.suning.com/0010359562/12442996533.html"],
      ["永艺 撑腰椅大Spro", "https://product.suning.com/0010359562/000000012440006654.html"],
      ["永艺 Flow360", "http://product.suning.com/0010359562/12443718565.html"],
      ["永艺 沃克pro", "https://product.suning.com/0010359562/000000012443037807.html"],
      ["永艺 xy", "http://product.suning.com/0010359562/12443019617.html"],
    ],
  },
  {
    brand: "八九间",
    products: [
      ["八九间 TO-573-W", "https://product.suning.com/0000000000/000000012414553741.html"],
      ["八九间 TO-701-W", "https://product.suning.com/0000000000/12414559996.html"],
      ["八九间 TO-579-W", "http://product.suning.com/0000000000/12183596110.html"],
      ["八九间 TO-721-W", "https://product.suning.com/0000000000/12386366029.html"],
      ["八九间 TO-568-Z", "http://product.suning.com/0000000000/12404202205.html"],
      ["八九间 TO-728-W学", "https://product.suning.com/0000000000/12283907943.html"],
    ],
  },
];

function fullRes(url) {
  return url.replace(/_\d+w_\d+h_\d+e_\d+Q.*$/, "").replace(/_\d+w_\d+h.*$/, "");
}

async function scrapeProduct(browser, brand, name, url) {
  const page = await browser.newPage({ viewport: { width: 750, height: 1200 } });
  page.setDefaultTimeout(30000);
  const result = { brand, name, url, images: 0, specs: {} };

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    const title = await page.title();
    result.title = title;

    // 提取文字参数
    const text = await page.evaluate(() => document.body.innerText);
    const priceM = text.match(/[¥￥]\s*([\d.]+)/);
    result.specs.price = priceM ? parseFloat(priceM[1]) : null;
    result.specs.材质 = text.match(/材质[：:\s]*([^\n]+)/)?.[1]?.slice(0, 20) || null;
    result.specs.可躺 = text.includes("可躺");
    result.specs.可旋转 = text.includes("可旋转");
    result.specs.升降扶手 = text.includes("升降扶手");

    // 滚动加载图片
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 2500));
      await page.waitForTimeout(500);
    }

    const rawUrls = await page.evaluate(() => {
      const set = new Set();
      document.querySelectorAll("img").forEach(img => {
        const src = img.src || img.getAttribute("data-original") || img.getAttribute("data-src") || "";
        if (src && src.includes("imgservice.suning.cn")) set.add(src);
      });
      return [...set];
    });

    const fullUrls = [...new Set(rawUrls.map(fullRes))];

    const dir = path.join(IMG_ROOT, brand, name.replace(/[^\w\u4e00-\u9fff]/g, "_"));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let downloaded = 0;
    for (let i = 0; i < fullUrls.length; i++) {
      try {
        const resp = await page.request.get(fullUrls[i]);
        if (resp.ok()) {
          const buf = await resp.body();
          if (buf.length > 10000) {
            const ext = fullUrls[i].match(/\.(jpg|jpeg|png)/i)?.[1] || "jpg";
            fs.writeFileSync(path.join(dir, `${i + 1}.${ext}`), buf);
            downloaded++;
          }
        }
      } catch (e) {}
    }
    result.images = downloaded;
    console.log(`✅ ${brand} ${name}: ${downloaded} 张图, 价格 ${result.specs.price || "?"}`);
  } catch (e) {
    result.error = e.message;
    console.log(`❌ ${brand} ${name}: ${e.message}`);
  } finally {
    await page.close();
  }
  return result;
}

async function main() {
  console.log("=== 批量爬取开始 ===\n");
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const brand of BRANDS) {
    for (const [name, url] of brand.products) {
      results.push(await scrapeProduct(browser, brand.brand, name, url));
    }
  }

  await browser.close();
  const outPath = "C:/Users/pyz/Desktop/椅子产品库/批量爬取结果.json";
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n=== 完成，${results.length} 款产品，结果 → ${outPath} ===`);
}

main().catch(e => { console.error(e); process.exit(1); });
