import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user: sbUser } } = await supabaseServer.auth.getUser();
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseAdmin = createAdminClient();
    const { data: chatSessionsRaw, error } = await supabaseAdmin
      .from('ChatSession')
      .select('id, title, createdAt, updatedAt, messages')
      .eq('userId', sbUser.id)
      .order('updatedAt', { ascending: false });

    if (error) {
      console.error("[Chat] Fetch error:", error);
      return NextResponse.json({ sessions: [] });
    }

    const chatSessions = chatSessionsRaw.map(s => {
      let lastMsgText = "No messages";
      try {
        const msgs = typeof s.messages === 'string' ? JSON.parse(s.messages) : s.messages;
        if (msgs && msgs.length > 0) {
          const last = msgs[msgs.length - 1];
          const content = last.content;
          
          if (Array.isArray(content)) {
            const textPart = content.find((c: any) => c.type === 'text');
            lastMsgText = textPart?.text || "Image Attachment";
          } else {
            lastMsgText = content || "No content";
          }

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
    
    // Fetch Context from Supabase
    const { data: context } = await supabaseAdmin
      .from('UserContext')
      .select('*')
      .eq('userId', sbUser.id)
      .single();

    let workspace = {};
    try { workspace = typeof context?.recentFiles === 'string' ? JSON.parse(context.recentFiles) : (context?.recentFiles || {}); } catch (e) {}

    return NextResponse.json({ 
      sessions: chatSessions, 
      workspace,
      activeProject: context?.activeProject || "Untitled"
    });
  } catch (error) {
    console.error("GET Chat Sessions Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user: sbUser } } = await supabaseServer.auth.getUser();
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

    const supabaseAdmin = createAdminClient();

    // Credit system removed for Unlimited Chat
    const userPlan = "free";
    const dailyCredits = 50;
    const lifetimeCredits = 0;
    const cost = 0;

    const body = await req.json();
    const { messages, sessionId, attachments = [] } = body;
    
    // Support both singular and plural env keys, and multiple comma-separated keys
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
            timeout: 20000 // 20s timeout
          });
          return res.data;
        } catch (err: any) {
          lastError = err;
          const status = err.response?.status;
          console.warn(`[Chat] Key failed (${status}):`, err.message);
          
          if (status === 429) continue; // Rate limit - try next key
          if (status === 401 || status === 403) continue; // Auth error - try next key
          
          // For other errors, we might want to try another key too, but let's be careful
          continue; 
        }
      }
      throw lastError || new Error("All AI keys exhausted or failed");
    }

    const tools: any[] = [
      {
        type: "function",
        function: {
          name: "search_web",
          description: "Search the web for real-time info, news, or facts.",
          parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_image",
          description: "Generate an AI image based on a prompt.",
          parameters: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] }
        }
      }
    ];

    // Fetch or create UserContext in Supabase
    let { data: userContext, error: contextError } = await supabaseAdmin
      .from('UserContext')
      .select('*')
      .eq('userId', sbUser.id)
      .single();

    if (!userContext) {
      const { data: newContext } = await supabaseAdmin
        .from('UserContext')
        .insert({ userId: sbUser.id })
        .select()
        .single();
      userContext = newContext;
    }

    const contextStr = `USER CONTEXT (Past interactions):
- Preferences: ${userContext?.preferences || 'None'}
- Memories: ${userContext?.memories || 'None'}
`;

    const systemPrompt = `You are Lumora AI. Be direct, witty, and proactive. Use markdown. Current Context: ${contextStr}`;
    const model = "llama-3.3-70b-versatile";

    // Strip unsupported properties like 'attachments' before sending to Groq
    const sanitizedMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    let currentMessages = [{ role: "system", content: systemPrompt }, ...sanitizedMessages];
    
    // ... Simplified Tool Call Logic for Brevity in this migration ...
    // Note: Keeping the core LLM call and response logic from original
    const data = await callGroq({ model, messages: currentMessages, temperature: 0.5 });
    
    if (!data || !data.choices || !data.choices[0]) {
      throw new Error("AI Service returned an empty or invalid response");
    }

    const finalAiContent = data.choices[0].message.content || "";
    
    const finalMessages = [...messages, { role: "assistant", content: finalAiContent }];
    let activeSessionId = sessionId;

    if (activeSessionId) {
      await supabaseAdmin
        .from('ChatSession')
        .update({ messages: JSON.stringify(finalMessages), updatedAt: new Date().toISOString() })
        .eq('id', activeSessionId);
    } else {
      const firstMsg = messages.find((m: any) => m.role === 'user')?.content || "New Chat";
      const { data: newSession } = await supabaseAdmin
        .from('ChatSession')
        .insert({ 
          userId: sbUser.id, 
          title: firstMsg.substring(0, 40), 
          messages: JSON.stringify(finalMessages) 
        })
        .select()
        .single();
      activeSessionId = newSession?.id;
    }

    // Credit consumption with Safety Bypass
    try {
      // We don't await this or block the user if it fails
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.url.includes('localhost') ? 'http://localhost:3000' : '');
      fetch(`${baseUrl}/api/user/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
        body: JSON.stringify({ action: 'consume-message', amount: 1 })
      }).catch(e => console.warn("[Chat] Credit consumption fire-and-forget failed:", e));
    } catch (e) {}

    return NextResponse.json({ message: finalAiContent, id: activeSessionId });
    } catch (err: any) {
      console.error("[Chat] CRITICAL ERROR:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.error?.message || err.message || "AI model failed to respond";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}

