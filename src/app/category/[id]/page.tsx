import { CATEGORIES } from "@/data/tools";
import { CategoryClient } from "./CategoryClient";
import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const category = CATEGORIES.find(c => c.id === id);
  
  if (!category) return { title: "Category Not Found" };

  const name = category.name;
  
  // Attractive SEO Titles
  let seoTitle = `${name} - Professional AI-Powered Toolset`;
  if (id === 'image') seoTitle = "Best Free AI Image Tools - Magic Eraser, Background Remover & More";
  if (id === 'video') seoTitle = "Pro AI Video Tools - Background Remover, Trimmer & Enhancer";
  if (id === 'ai') seoTitle = "AI Magic Studio - Writing, Coding & Intelligent Chat";
  if (id === 'audio') seoTitle = "AI Audio Tools - Vocal Remover & Studio Stem Splitter";
  if (id === 'pdf') seoTitle = "Smart PDF Tools - Merge, Split, Compress & OCR Text";

  return constructMetadata({
    title: seoTitle,
    description: `Discover our collection of professional ${name.toLowerCase()} architected for elite creative workflows. High-performance, AI-driven, and easy to use.`,
    canonicalUrl: `https://lumoraai.online/category/${id}`,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = CATEGORIES.find(c => c.id === id);

  if (!category) {
    notFound();
  }

  return <CategoryClient categoryId={id} />;
}
