import { TOOLS, CATEGORIES } from "@/data/tools";
import { ToolDetailClient } from "./ToolDetailClient";
import { getToolMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { PRICING_CONFIG } from "@/config/pricing";
import { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ category: string; toolId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { toolId } = await params;
  return getToolMetadata(toolId);
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { category: categoryId, toolId } = await params;
  
  const tool = TOOLS.find(t => t.id === toolId || t.id === `${categoryId}-${toolId}`);
  const category = CATEGORIES.find(c => c.id === categoryId);
  const relatedTools = TOOLS.filter(t => t.category === categoryId && t.id !== tool?.id).slice(0, 3);

  if (!tool || !category) {
    notFound();
  }

  // Software Application Schema
  const softwareSchema = {
    name: tool.name,
    description: tool.description,
    applicationCategory: `${category.name}Application`,
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: tool.pro ? PRICING_CONFIG.PRO_PLAN.USD.toString() : '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <JsonLd type="SoftwareApplication" data={softwareSchema} />
      <ToolDetailClient 
        tool={tool} 
        category={category} 
        relatedTools={relatedTools} 
        categoryId={categoryId} 
        toolId={toolId} 
      />
    </>
  );
}
