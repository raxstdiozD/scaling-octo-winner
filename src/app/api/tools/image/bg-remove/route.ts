import { NextRequest } from "next/server";
import { withToolHandler } from "@/lib/tools-handler";
import axios from "axios";
import { writeFile } from "fs/promises";
import path from "path";
import { getEngineRoute } from "@/config/engine";

// Practical local storage for results (Phase 2)
const STORAGE_PATH = path.join(process.cwd(), "public", "results");

export async function POST(req: NextRequest) {
  return withToolHandler(req, {
    toolId: "bg-remove",
    allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    maxSize: 10 * 1024 * 1024, // 10MB
    creditCost: 1
  }, async (buffer, jobId, formData) => {
    
    // 1. Try Local Python FastAPI Service (If available)
    try {
      const formData = new FormData();
      const blob = new Blob([buffer]);
      formData.append("file", blob, "input.png");

      const response = await axios.post(getEngineRoute("/image/remove-bg"), formData, {
        responseType: 'arraybuffer',
        timeout: 5000 // Short timeout for local service
      });

      const fileName = `result_${jobId}.png`;
      const fullPath = path.join(STORAGE_PATH, fileName);
      await writeFile(fullPath, Buffer.from(response.data));
      return { resultUrl: `/results/${fileName}` };
    } catch (localError) {
      console.log("Local BG removal failed, trying cloud APIs...");
    }

    // 2. Try Hugging Face (Free)
    const hfToken = process.env.HUGGINGFACE_TOKEN;
    if (hfToken) {
      try {
        console.log("Attempting background removal via Hugging Face...");
        const hfUrl = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";
        const hfResponse = await axios.post(hfUrl, buffer, {
          headers: { Authorization: `Bearer ${hfToken}` },
          responseType: 'arraybuffer',
          timeout: 30000
        });

        const fileName = `result_hf_${jobId}.png`;
        const fullPath = path.join(STORAGE_PATH, fileName);
        await writeFile(fullPath, Buffer.from(hfResponse.data));
        return { resultUrl: `/results/${fileName}` };
      } catch (hfError: any) {
        console.error("Hugging Face BG Removal Failed:", hfError.message);
      }
    }

    // 3. Try Fal.ai (Premium)
    const falKey = process.env.FAL_KEY;
    if (falKey) {
      try {
        console.log("Attempting background removal via Fal.ai...");
        // Convert buffer to base64 for Fal.ai
        const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;
        const falResponse = await fetch("https://fal.run/fal-ai/bria/background-removal", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ image_url: base64Image })
        });

        const data = await falResponse.json();
        if (data.image && data.image.url) {
           return { resultUrl: data.image.url };
        }
      } catch (falError: any) {
        console.error("Fal.ai BG Removal Failed:", falError.message);
      }
    }

    throw new Error("No background removal service is currently available.");
  });
}
