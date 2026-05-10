import { Metadata } from "next";
import { ProClient } from "./ProClient";

export const metadata: Metadata = {
  title: "Lumora Pro - Unlimited Elite AI Power",
  description: "Upgrade to Lumora Pro for unlimited AI generations, 20x faster processing, 4K exports, and commercial rights. Unlock the full potential of our elite AI studio.",
  openGraph: {
    title: "Lumora Pro - Unlock Elite AI Studio Power",
    description: "Join the pro creators. Get unlimited access to 50+ AI tools with priority processing and no watermarks.",
    url: "https://lumoraai.online/pro",
  },
  alternates: {
    canonical: "https://lumoraai.online/pro",
  },
};

export default function ProPage() {
  return <ProClient />;
}
