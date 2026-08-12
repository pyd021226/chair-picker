import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工学椅智能匹配 — 找到适合你身体的椅子 | 野生的装机宅",
  description:
    "输入身高体重，基于中国成年人人体尺寸标准，科学匹配最适合你的工学椅。不再凭感觉选椅子。野生的装机宅 出品。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
        <footer className="text-center text-xs text-neutral-400 py-6 mt-auto space-y-1">
          <p>
            <a
              href="https://space.bilibili.com/941799"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors"
            >
              野生的装机宅
            </a>
            {" "}出品 · 数据基于 GB10000-88 中国成年人人体尺寸标准推算
          </p>
          <p>匹配结果仅供参考，建议结合试坐体验做最终决定</p>
        </footer>
      </body>
    </html>
  );
}
