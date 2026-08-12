import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工学椅智能匹配 | 野生的装机宅",
  description: "输入身高体重，基于中国人体数据标准，科学匹配最适合你的工学椅。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fafafa] text-[#171717] antialiased">
        {children}
        <footer className="text-center text-xs text-[#a3a3a3] py-8 mt-auto space-y-1.5">
          <p>
            <a href="https://space.bilibili.com/941799" target="_blank" rel="noopener noreferrer"
               className="text-[#525252] hover:text-[#2563eb] transition-colors duration-200">
              野生的装机宅
            </a>
            <span className="mx-1.5 opacity-40">/</span>
            数据基于 GB10000-88 中国成年人人体尺寸标准推算
          </p>
          <p className="opacity-60">匹配结果仅供参考，建议结合试坐体验做最终决定</p>
        </footer>
      </body>
    </html>
  );
}
