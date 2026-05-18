import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (!sbUser || !sbUser.email) {
      return NextResponse.json({ error: "Please sign in to use AI Writer" }, { status: 401 });
    }

    const { prompt, tone, length } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Credit Check (Pre-flight) via Prisma
    let user = await prisma.user.findUnique({
      where: { id: sbUser.id }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: sbUser.id,
          email: sbUser.email!,
          name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0],
          dailyCredits: 50
        }
      });
    }

    const dailyCredits = user.dailyCredits ?? 0;
    const lifetimeCredits = user.lifetimeCredits ?? 0;
    const totalCreditsAvailable = dailyCredits + lifetimeCredits;
    const cost = 5;

    if (totalCreditsAvailable < cost) {
      return NextResponse.json({ error: "Insufficient credits. AI Writer costs 5 credits." }, { status: 403 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "Groq API Key not found in environment." }, { status: 500 });
    }

    const systemPrompt = `You are a world-class AI writing assistant. 
    Your goal is to generate high-quality, engaging, and purposeful content.
    Tone: ${tone}
    Length: ${length}
    Instructions: Respond ONLY with the requested content. No conversational filler or introductions.`;

    console.log("[AiWriter] Calling Groq Cloud API...");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: length === "Long" ? 2048 : length === "Medium" ? 1024 : 512,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[AiWriter] Groq Error Detail:", JSON.stringify(errorData, null, 2));
      return NextResponse.json({ 
        error: errorData.error?.message || `Groq API Error (${response.status})` 
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // 2. Deduct Credits only on SUCCESS
    let newLifetime = lifetimeCredits;
    let newDaily = dailyCredits;

    if (newLifetime >= cost) {
      newLifetime -= cost;
    } else {
      const remaining = cost - newLifetime;
      newLifetime = 0;
      newDaily = Math.max(0, newDaily - remaining);
    }

    await prisma.user.update({
      where: { id: sbUser.id },
      data: {
        lifetimeCredits: newLifetime,
        dailyCredits: newDaily
      }
    });

    return NextResponse.json({ content });

  } catch (error: any) {
    console.error("[AiWriter] API Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during generation." }, { status: 500 });
  }
}

