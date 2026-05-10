import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (!sbUser || !sbUser.email) {
      return NextResponse.json({ error: "Please sign in to generate code" }, { status: 401 });
    }

    // Check credits
    let user = await prisma.user.findUnique({ where: { email: sbUser.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: sbUser.id,
          email: sbUser.email,
          name: sbUser.name || sbUser.email.split('@')[0],
          credits: 50,
          plan: 'free'
        }
      });
    }

    // Credit system (Sync with Supabase)
    const { data: creditData } = await supabase
      .from('User')
      .select('daily_credits, lifetime_credits, plan')
      .eq('id', sbUser.id)
      .single();

    const dailyCredits = creditData?.daily_credits ?? 0;
    const lifetimeCredits = creditData?.lifetime_credits ?? 0;
    const totalCreditsAvailable = dailyCredits + lifetimeCredits;
    const userPlan = creditData?.plan ?? user.plan;

    const cost = 5;
    if (userPlan !== 'pro' && totalCreditsAvailable < cost) {
      return NextResponse.json({ error: "Insufficient credits. Upgrade to Pro for unlimited coding!" }, { status: 403 });
    }

    const { prompt, language, framework } = await req.json();

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("GROQ_API_KEY missing");

    const systemPrompt = `You are Lumora Code Genius, an elite AI software engineer. 
Your goal is to generate clean, modern, and highly efficient code.

RESPONSE STRUCTURE (STRICTLY FOLLOW THIS):
1. [CODE_START]
   <Your clean code block here>
   [CODE_END]

2. [GUIDE_START]
   <A concise, professional step-by-step implementation guide>
   [GUIDE_END]

3. [SUGGESTIONS_START]
   - Suggestion 1 (Plain text only, max 10 words)
   - Suggestion 2 (Plain text only, max 10 words)
   - Suggestion 3 (Plain text only, max 10 words)
   [SUGGESTIONS_END]

Instructions:
- Target Language: ${language || 'Auto-detect'}
- Target Framework: ${framework || 'None'}
- Never include instructions inside the code block.
- Ensure delimiters are on their own lines.`;

    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Lower temperature for more accurate code
      max_tokens: 2048
    }, {
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      }
    });

    const codeOutput = response.data.choices[0].message.content;

    // Deduct credits (Sync with Supabase)
    if (userPlan !== 'pro') {
      let newLifetime = lifetimeCredits;
      let newDaily = dailyCredits;

      if (newLifetime >= cost) {
        newLifetime -= cost;
      } else {
        const remaining = cost - newLifetime;
        newLifetime = 0;
        newDaily -= remaining;
      }

      await Promise.all([
        prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: cost } } }),
        prisma.job.create({
          data: {
            userId: user.id,
            toolType: 'ai-code',
            status: 'COMPLETED',
            originalUrl: prompt,
            resultUrl: codeOutput,
            metadata: { language, framework, model: "llama-3.3-70b-versatile" }
          }
        }),
        supabase
          .from('User')
          .update({ 
            lifetime_credits: newLifetime,
            daily_credits: newDaily 
          })
          .eq('id', sbUser.id)
      ]);
    } else {
       await prisma.job.create({
          data: {
            userId: user.id,
            toolType: 'ai-code',
            status: 'COMPLETED',
            originalUrl: prompt,
            resultUrl: codeOutput,
            metadata: { language, framework, model: "llama-3.3-70b-versatile" }
          }
       });
    }

    return NextResponse.json({ code: codeOutput });

  } catch (error: any) {
    console.error("Code Gen Error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to generate code. Please try again." }, { status: 500 });
  }
}
