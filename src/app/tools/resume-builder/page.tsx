import { ResumeBuilder } from "@/components/tool/ResumeBuilder";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Resume Builder | Create Professional CVs Online",
  description: "Build a professional, ATS-friendly resume in minutes with AI content suggestions and modern templates.",
};

export default function ResumeBuilderPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="pt-32 px-6">
        <ResumeBuilder />
      </div>
    </main>
  );
}
