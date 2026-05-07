import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const COMFY_URL = "http://localhost:8188";
const STORAGE_PATH = path.join(process.cwd(), "public", "generations");

/**
 * Flux.1 Schnell Basic Workflow JSON Template
 * This structure corresponds to what ComfyUI expects.
 */
const getFluxWorkflow = (prompt: string, width: number, height: number, seed: number, steps: number = 4) => ({
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "cfg": 1,
      "denoise": 1,
      "latent_image": ["5", 0],
      "model": ["10", 0],
      "negative_conditioning": ["7", 0],
      "positive_conditioning": ["6", 0],
      "sampler_name": "euler_ancestral",
      "scheduler": "simple",
      "seed": seed,
      "steps": steps
    }
  },
  "4": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["10", 1]
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "batch_size": 1,
      "height": height,
      "width": width
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["10", 0],
      "text": prompt
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "clip": ["10", 0],
      "text": "bad eyes, bad hands, low resolution"
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "Lumora",
      "images": ["4", 0]
    }
  },
  "10": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "flux1-schnell.safetensors"
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (!sbUser || !sbUser.email) {
      return NextResponse.json({ error: "Please sign in to generate images" }, { status: 401 });
    }

    // 1. Get or create user in Prisma with plan-based defaults
    let user = await prisma.user.findUnique({
        where: { email: sbUser.email! }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
            id: sbUser.id,
            email: sbUser.email!,
            name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0],
            plan: "free",
            credits: 50, // 5 generations for free users
            aiGenerationsLimit: 5,
            nextResetDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
        }
      })
    }

    // 2. Daily Reset Logic
    const now = new Date();
    if (user.nextResetDate && now > user.nextResetDate) {
      const isPro = user.plan === "pro";
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          credits: isPro ? 1000 : 50,
          aiGenerationsUsed: 0,
          nextResetDate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
      });
    }

    const { prompt, width = 1024, height = 1024, steps = 4, guidance = 3.5, n = 1 } = await req.json();

    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    // 3. Credit Check (10 credits per generation)
    const costPerGen = 10;
    const totalCost = costPerGen * n;

    if (user.credits < totalCost) {
      const upgradeMsg = user.plan === "free" 
        ? "You've reached your free daily limit. Pro users get 1,000 credits daily (100+ generations). Upgrade now for unlimited creative flow!"
        : "You've reached your Pro daily limit. Please wait for the daily reset or contact support for higher limits.";
      
      return NextResponse.json({ 
        error: upgradeMsg,
        needsUpgrade: user.plan === "free"
      }, { status: 403 });
    }

    let imageBuffer: Buffer;
    let method = "flux-schnell-pollinations";

    try {
      // PRIMARY METHOD: Pollinations AI (100% FREE & UNLIMITED)
      // This is the best way to get Flux Schnell without costs
      console.log("Using Pollinations Flux Schnell (Free)...");
      const seed = Math.floor(Math.random() * 2147483647);
      
      // Constructing the optimized Pollinations URL
      const cloudUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&enhance=true`;
      
      const cloudResponse = await axios.get(cloudUrl, {
        responseType: 'arraybuffer',
        timeout: 40000 
      });

      const contentType = cloudResponse.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        throw new Error("Pollinations returned an error page.");
      }

      imageBuffer = Buffer.from(cloudResponse.data);

    } catch (pollError: any) {
      console.error("Pollinations Primary Failed:", pollError.message);
      
      try {
        // SECONDARY FALLBACK: Hugging Face (Free Tier with Token)
        console.log("Falling back to Hugging Face...");
        const hfToken = process.env.HUGGINGFACE_TOKEN;
        if (!hfToken) throw pollError;

        const hfUrl = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
        const hfResponse = await axios.post(hfUrl, {
          inputs: prompt,
          parameters: { width, height }
        }, {
          headers: { Authorization: `Bearer ${hfToken}` },
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        imageBuffer = Buffer.from(hfResponse.data);
        method = "flux-schnell-hf-fallback";
      } catch (hfError) {
        throw new Error("All free generation services are currently busy. Please try again in a moment.");
      }
    }

    // 2. Save Locally to Public Folder
    await mkdir(STORAGE_PATH, { recursive: true });
    const localFileName = `flux_${uuidv4()}.png`;
    const localFilePath = path.join(STORAGE_PATH, localFileName);
    await writeFile(localFilePath, imageBuffer);

    // 3. DB Record & Credit Deduction
    const resultUrl = `/generations/${localFileName}`;
    
    await prisma.$transaction([
      prisma.job.create({
        data: {
          userId: user.id,
          toolType: 'ai-img-gen',
          status: 'COMPLETED',
          resultUrl,
          originalUrl: prompt,
          // Store metadata (Prisma handles Json serialization)
          metadata: { 
            width, 
            height, 
            steps, 
            guidance, 
            model: 'flux-schnell',
            timestamp: new Date().toISOString()
          }
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          credits: { decrement: totalCost },
          aiGenerationsUsed: { increment: n }
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      imageUrl: resultUrl,
      method,
      creditsRemaining: user.credits - totalCost
    });

  } catch (error: any) {
    console.error("Critical Generation Error:", error.message);
    return NextResponse.json({ 
      error: error.message || "Generation failed. Please try again." 
    }, { status: 500 });
  }
}
