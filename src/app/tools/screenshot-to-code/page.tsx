import { TOOLS, CATEGORIES } from "@/data/tools";
import { constructMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { ScreenshotToCode } from "@/components/tool/ScreenshotToCode";

export const metadata: Metadata = constructMetadata({
  title: "AI Screenshot to Code - Convert UI Designs to React & Tailwind",
  description: "Transform your UI screenshots into clean, production-ready React and Tailwind CSS code instantly using advanced AI vision models.",
  canonicalUrl: "https://lumoraai.online/tools/screenshot-to-code",
});

export default function ScreenshotToCodePage() {
  const tool = TOOLS.find(t => t.id === 'screenshot-to-code');
  const category = CATEGORIES.find(c => c.id === 'ai');

  if (!tool || !category) return null;

  return (
    <div className="min-h-screen bg-[#030303]">
      <ScreenshotToCode />
    </div>
  );
}
