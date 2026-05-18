import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user: sbUser } } = await supabaseServer.auth.getUser();
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const chatSessionsRaw = await prisma.chatSession.findMany({
      where: { userId: sbUser.id },
      orderBy: { updatedAt: 'desc' }
    });

    const chatSessions = chatSessionsRaw.map(s => {
      let lastMsgText = "No messages";
      try {
        const msgs = typeof s.messages === 'string' ? JSON.parse(s.messages) : s.messages;
        if (Array.isArray(msgs) && msgs.length > 0) {
          const last = msgs[msgs.length - 1];
          lastMsgText = last.content || "No content";
          if (lastMsgText.length > 60) lastMsgText = lastMsgText.substring(0, 60) + "...";
        }
      } catch (e) {
        console.error("History Parse Error:", e);
      }
      
      return {
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastMessage: lastMsgText
      };
    });
    
    // Fetch Context from Prisma
    const context = await prisma.userContext.findUnique({
      where: { userId: sbUser.id }
    });

    let workspace = {};
    try { workspace = typeof context?.recentFiles === 'string' ? JSON.parse(context.recentFiles) : (context?.recentFiles || {}); } catch (e) {}

    return NextResponse.json({ 
      sessions: chatSessions, 
      workspace,
      activeProject: context?.activeProject || "Untitled"
    });
  } catch (error) {
    console.error("GET Chat Sessions Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user: sbUser } } = await supabaseServer.auth.getUser();
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

    const body = await req.json();
    const { messages, sessionId } = body;
    
    // Support both singular and plural env keys
    const rawKeys = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
    const groqKeys = rawKeys.split(",").map(k => k.trim()).filter(Boolean);
    
    if (groqKeys.length === 0) {
      console.error("[Chat] No GROQ_API_KEY found in environment");
      return NextResponse.json({ error: "AI Service Configuration Error" }, { status: 500 });
    }

    async function callGroq(payload: any) {
      let lastError = null;
      for (const key of groqKeys) {
        try {
          const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", payload, {
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
            timeout: 20000 
          });
          return res.data;
        } catch (err: any) {
          lastError = err;
          if (err.response?.status === 429) continue;
          if (err.response?.status === 401 || err.response?.status === 403) continue;
          throw err;
        }
      }
      throw lastError || new Error("All AI keys exhausted or failed");
    }

    // Fetch or create UserContext
    let userContext = await prisma.userContext.findUnique({ where: { userId: sbUser.id } });
    if (!userContext) {
      userContext = await prisma.userContext.create({ data: { userId: sbUser.id } });
    }

    const contextStr = `USER CONTEXT: Preferences: ${userContext?.preferences || 'None'}, Memories: ${userContext?.memories || 'None'}`;
    const systemPrompt = `You are Lumora AI. Be direct, witty, and proactive. Use markdown. ${contextStr}`;
    const model = "llama-3.3-70b-versatile";

    // Strip unsupported properties
    const sanitizedMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));
    const groqPayload = { 
      model, 
      messages: [{ role: "system", content: systemPrompt }, ...sanitizedMessages], 
      temperature: 0.5 
    };

    const data = await callGroq(groqPayload);
    if (!data?.choices?.[0]) throw new Error("AI Service invalid response");

    const finalAiContent = data.choices[0].message.content || "";
    const finalMessages = [...messages, { role: "assistant", content: finalAiContent }];
    let activeSessionId = sessionId;

    // Ensure user exists in Prisma before creating session
    await prisma.user.upsert({
      where: { id: sbUser.id },
      update: {},
      create: {
        id: sbUser.id,
        email: sbUser.email,
        name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
      }
    });

    if (activeSessionId) {
      await prisma.chatSession.update({
        where: { id: activeSessionId },
        data: { messages: JSON.stringify(finalMessages) }
      });
    } else {
      const firstMsg = messages.find((m: any) => m.role === 'user')?.content || "New Chat";
      const newSession = await prisma.chatSession.create({
        data: {
          userId: sbUser.id,
          title: firstMsg.substring(0, 40),
          messages: JSON.stringify(finalMessages)
        }
      });
      activeSessionId = newSession.id;
    }

    // Fire-and-forget credit consumption
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.url.includes('localhost') ? 'http://localhost:3000' : '');
      fetch(`${baseUrl}/api/user/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
        body: JSON.stringify({ action: 'consume-message', amount: 1 })
      }).catch(e => console.warn("[Chat] Credits sync failed:", e.message));
    } catch (e) {}

    return NextResponse.json({ message: finalAiContent, id: activeSessionId });
  } catch (err: any) {
    console.error("[Chat] POST Error:", err.message);
    const errorMsg = err.response?.data?.error?.message || err.message || "AI failed to respond";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

