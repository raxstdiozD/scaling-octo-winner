import { SocialCaptionGenerator } from "@/components/tool/SocialCaptionGenerator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Social Media Caption Generator | Lumora",
  description: "Generate viral, platform-optimized captions with AI vision.",
};

export default function SocialCaptionPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="pt-32 px-6">
        <SocialCaptionGenerator />
      </div>
    </main>
  );
}
