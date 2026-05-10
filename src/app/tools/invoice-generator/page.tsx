import { TOOLS, CATEGORIES } from "@/data/tools";
import { constructMetadata } from "@/lib/seo";
import { Metadata } from "next";
import { InvoiceGeneratorClient } from "@/components/tool/InvoiceGenerator";

export const metadata: Metadata = constructMetadata({
  title: "Free Invoice Generator - Create Professional Invoices Online",
  description: "Create professional, branded invoices for your business or freelance work with our free AI-powered invoice generator. Custom templates, tax calculation, and more.",
  canonicalUrl: "https://lumoraai.online/tools/invoice-generator",
});

export default function InvoiceGeneratorPage() {
  const tool = TOOLS.find(t => t.id === 'invoice-generator');
  const category = CATEGORIES.find(c => c.id === 'productivity');

  if (!tool || !category) return null;

  return (
    <div className="min-h-screen bg-[#030303]">
      <InvoiceGeneratorClient tool={tool} category={category} />
    </div>
  );
}
