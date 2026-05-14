import { NextRequest, NextResponse } from "next/server";
import { withToolHandler } from "@/lib/tools-handler";
import axios from "axios";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(messages: any[], model: string = "llama-3.3-70b-versatile") {
  const rawKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
  const keys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error("No Groq API keys configured");

  let lastError: any = null;
  for (const key of keys) {
    try {
      const response = await axios.post(
        GROQ_API_URL,
        { model, messages, temperature: 0.7, max_tokens: 2048 },
        { headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error: any) {
      lastError = error;
      if (error.response?.status === 429) continue;
      throw error;
    }
  }
  throw lastError || new Error("All Groq keys failed");
}

async function callGroqVision(messages: any[]) {
  return callGroq(messages, "meta-llama/llama-4-scout-17b-16e-instruct");
}

export async function POST(req: NextRequest) {
  return withToolHandler(
    req,
    {
      toolId: "social-caption-generator",
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
      maxSize: 5 * 1024 * 1024,
      creditCost: 10,
      optionalFile: true,
    },
    async (fileBuffer, jobId, formData) => {
      const topic = formData.get("topic") as string;
      const product = formData.get("product") as string;
      const mood = formData.get("mood") as string;
      const platform = formData.get("platform") as string;

      if (!topic && !product && (!fileBuffer || fileBuffer.length === 0)) {
        throw new Error("Please provide a topic, product, or image");
      }

      let base64Image = "";
      if (fileBuffer && fileBuffer.length > 0) {
        base64Image = fileBuffer.toString("base64");
      }

      const systemPrompt = `You are a viral social media strategist and expert copywriter.
Generate 8-10 high-quality, engaging captions for ${platform}.
Tone: ${mood}
Topic/Context: ${topic || product || "Provided image"}

REQUIREMENTS:
- Each caption must be unique and optimized for ${platform}.
- For YouTube, focus on compelling video titles and short video descriptions.
- Include appropriate emojis.
- Include a list of relevant hashtags at the end of each caption.
- Format the response as a JSON array of objects: [{ "caption": "...", "hashtags": ["...", "..."] }]
- DO NOT return anything except the JSON array.
- Start your response with [ and end with ]`;

      let response;
      if (base64Image) {
        response = await callGroqVision([
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and generate captions based on the context." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ]);
      } else {
        response = await callGroq([
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate captions for: ${topic || product}` }
        ]);
      }

      const content = response.choices[0].message.content.trim();
      const jsonStart = content.indexOf("[");
      const jsonEnd = content.lastIndexOf("]") + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("Invalid AI response format from Groq");
      }

      const results = JSON.parse(content.substring(jsonStart, jsonEnd));
      
      return {
        resultUrl: JSON.stringify(results), // We use resultUrl to store the JSON string in the job record
        metadata: { platform, mood }
      };
    }
  );
}
