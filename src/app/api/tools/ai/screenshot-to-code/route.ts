// Force Rebuild v2
import { NextRequest, NextResponse } from "next/server";
import { withToolHandler } from "@/lib/tools-handler";
import axios from "axios";

export async function POST(req: NextRequest) {
  return withToolHandler(
    req,
    {
      toolId: "screenshot-to-code",
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      maxSize: 10 * 1024 * 1024, // 10MB
      creditCost: 15,
    },
    async (fileBuffer, jobId, formData) => {
      const rawKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
      const groqKeys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);
      if (groqKeys.length === 0) throw new Error("GROQ_API_KEY missing from environment");

      // Convert buffer to base64 for vision model
      const base64Image = fileBuffer.toString("base64");
      
      const framework = formData.get("framework") || "React + Tailwind";
      const quality = formData.get("quality") || "high";

      async function callGroqVision(payload: any) {
        let lastError = null;
        for (const key of groqKeys) {
          try {
            const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", payload, {
              headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
            });
            return res.data;
          } catch (err: any) {
            lastError = err;
            if (err.response?.status === 429) continue;
            throw err;
          }
        }
        throw lastError || new Error("All Groq keys failed");
      }

      const systemPrompt = `You are a world-class frontend developer and UI engineer.
Your task is to convert the provided screenshot into a pixel-perfect, highly accurate web component.

TECHNICAL REQUIREMENTS:
1. Use ${framework} with Tailwind CSS.
2. Use vibrant, accurate colors matching the screenshot exactly.
3. Ensure the layout is responsive and matches the original spacing/grid.
4. Use modern icons (Lucide/Heroicons) represented as SVGs or simple descriptive text placeholders.
5. If using React, provide a single self-contained component.
6. IMPORTANT: Ensure all Tailwind classes are standard and will work with the CDN version.

STRICT OUTPUT FORMAT:
- Return ONLY the code.
- No markdown code blocks (no \`\`\`tsx).
- No explanations.
- If React, start directly with the component logic.
- If HTML, start directly with the <div> container.`;

      try {
        const response = await callGroqVision({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: "Generate the code for this UI screenshot." },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        });

        const generatedCode = response.choices[0].message.content;

        // In a real app, we might upload this to a CDN or store in DB.
        // For now, we return it as the "resultUrl" (which we'll handle as text in the frontend)
        return { 
          resultUrl: generatedCode,
          metadata: { 
            framework, 
            quality,
            model: "meta-llama/llama-4-scout-17b-16e-instruct" 
          } 
        };
      } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message || error.message || "Unknown AI error";
        console.error("Groq Vision Error:", error.response?.data || error.message);
        throw new Error(`AI analysis failed: ${errorMessage}`);
      }
    }
  );
}
