import { Metadata } from "next";
import { BlogComingSoon } from "@/components/blog/BlogComingSoon";
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
  title: "Lumora Blog - AI Tools Tips & Tutorials",
  description: "The official Lumora Journal. Expert deep-dives into AI design, prompt engineering, and productivity hacks. Learn how to master the future of creativity.",
  canonicalUrl: "https://lumoraai.online/blog",
});

export default function BlogPage() {
  return <BlogComingSoon />;
}
