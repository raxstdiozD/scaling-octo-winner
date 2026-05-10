import { NextRequest, NextResponse } from "next/server";
// Forced Launch Update - Production Fix
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.cwd(), "public", "generations");

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (!sbUser || !sbUser.email) {
      return NextResponse.json({ error: "Please sign in to generate images" }, { status: 401 });
    }

    // 1. Get or create user in Prisma
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
            credits: 50,
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

    // 3. Sync Credits from Supabase (Source of Truth)
    const { data: creditData } = await supabase
      .from('User')
      .select('daily_credits, lifetime_credits, plan')
      .eq('id', sbUser.id)
      .single();

    const dailyCredits = creditData?.daily_credits ?? 0;
    const lifetimeCredits = creditData?.lifetime_credits ?? 0;
    const totalCreditsAvailable = dailyCredits + lifetimeCredits;
    const userPlan = creditData?.plan ?? user.plan;

    const costPerGen = 10;
    const totalCost = costPerGen * n;

    if (totalCreditsAvailable < totalCost) {
      const upgradeMsg = userPlan === "free" 
        ? "You've reached your free daily limit. Pro users get 1,000 credits daily (100+ generations). Upgrade now for unlimited creative flow!"
        : "You've reached your Pro daily limit. Please wait for the daily reset or contact support for higher limits.";
      
      return NextResponse.json({ 
        error: upgradeMsg,
        needsUpgrade: userPlan === "free"
      }, { status: 403 });
    }

    let imageBuffer: Buffer | null = null;
    let method = "unknown";

    // 4. GENERATION STRATEGY: Pro users get Fal.ai (Fastest), Free users get fallbacks
    const falKey = process.env.FAL_KEY;
    const isPro = userPlan === "pro";

    // --- STEP A: Try Fal.ai (Premium) for PRO users or as high-priority ---
    if (falKey && (isPro || Math.random() > 0.8)) {
      try {
        console.log("Attempting Premium Generation via Fal.ai...");
        const falResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            "Authorization": `Key ${falKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: prompt,
            image_size: { width, height },
            num_inference_steps: isPro ? 6 : 4,
            sync_mode: true
          })
        });

        if (!falResponse.ok) {
          const errorData = await falResponse.text();
          console.error(`Fal.ai API Error (${falResponse.status}):`, errorData);
        } else {
          const data = await falResponse.json();
          if (data.images && data.images[0]?.url) {
            console.log("Fal.ai Success! Downloading image...");
            const imgResp = await axios.get(data.images[0].url, { 
              responseType: 'arraybuffer',
              timeout: 15000 
            });
            imageBuffer = Buffer.from(imgResp.data);
            method = "fal-pro-schnell";
          } else {
            console.warn("Fal.ai returned success but no image URL:", data);
          }
        }
      } catch (falError: any) {
        console.error("Fal.ai Exception:", falError.message);
      }
    }

    // --- STEP B: Try Pollinations AI (Free) if not already generated ---
    if (!imageBuffer) {
      try {
        console.log("Using Pollinations Flux Schnell (Free)...");
        const seed = Math.floor(Math.random() * 2147483647);
        // Removed &enhance=true to prevent LLM latency/timeouts
        const cloudUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
        
        const cloudResponse = await axios.get(cloudUrl, {
          responseType: 'arraybuffer',
          timeout: 25000 // Shorter timeout for better user experience
        });

        const contentType = cloudResponse.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
          throw new Error("Pollinations returned an error page.");
        }

        imageBuffer = Buffer.from(cloudResponse.data);
        method = "flux-schnell-pollinations";
      } catch (pollError: any) {
        console.error("Pollinations Failed:", pollError.message);
      }
    }

    // --- STEP C: Try Hugging Face (Free Fallback) ---
    if (!imageBuffer) {
      try {
        console.log("Falling back to Hugging Face...");
        const hfToken = process.env.HUGGINGFACE_TOKEN;
        if (hfToken) {
          const hfUrl = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
          const hfResponse = await axios.post(hfUrl, {
            inputs: prompt,
            parameters: { width, height }
          }, {
            headers: { Authorization: `Bearer ${hfToken}` },
            responseType: 'arraybuffer',
            timeout: 25000
          });
          
          imageBuffer = Buffer.from(hfResponse.data);
          method = "flux-schnell-hf-fallback";
        }
      } catch (hfError: any) {
        console.error("Hugging Face Failed:", hfError.message);
      }
    }

    // --- FINAL CHECK ---
    if (!imageBuffer) {
      throw new Error("All generation services are currently busy. This usually happens during high traffic. Please try a different prompt or wait a minute.");
    }

    // 5. Save Locally to Public Folder
    await mkdir(STORAGE_PATH, { recursive: true });
    const localFileName = `flux_${uuidv4()}.png`;
    const localFilePath = path.join(STORAGE_PATH, localFileName);
    await writeFile(localFilePath, imageBuffer);

    // 6. DB Record & Credit Deduction
    const resultUrl = `/generations/${localFileName}`;
    
    let newLifetime = lifetimeCredits;
    let newDaily = dailyCredits;

    if (newLifetime >= totalCost) {
      newLifetime -= totalCost;
    } else {
      const remaining = totalCost - newLifetime;
      newLifetime = 0;
      newDaily = Math.max(0, newDaily - remaining);
    }

    const supabaseAdmin = createAdminClient();

    const { error: sbFileError } = await supabaseAdmin
      .from('UserFile')
      .insert({
        userId: sbUser.id,
        toolType: 'ai-img-gen',
        originalName: prompt.substring(0, 50),
        originalUrl: prompt,
        resultUrl,
        fileType: 'image',
        status: 'completed',
        metadata: { 
          width, height, steps, guidance, 
          model: 'flux-schnell',
          generationMethod: method,
          timestamp: new Date().toISOString()
        }
      });

    if (sbFileError) console.error("[Image Gen] Supabase history save failed:", sbFileError);

    const { error: sbCreditError } = await supabaseAdmin
      .from('User')
      .update({ 
        lifetime_credits: newLifetime,
        daily_credits: newDaily 
      })
      .eq('id', sbUser.id);

    if (sbCreditError) console.error("[Image Gen] Supabase credit update failed:", sbCreditError);

    return NextResponse.json({ 
      success: true, 
      imageUrl: resultUrl,
      method,
      creditsRemaining: totalCreditsAvailable - totalCost
    });

  } catch (error: any) {
    console.error("Critical Generation Error:", error.message);
    return NextResponse.json({ 
      error: error.message || "Generation failed. Please try again." 
    }, { status: 500 });
  }
}

