import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { prisma } from '@/lib/prisma';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let user = await prisma.user.findUnique({ where: { email: sbUser.email } });
    if (!user) return NextResponse.json({ sessions: [] });
    const chatSessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true }
    });
    
    const context = await prisma.userContext.findUnique({ where: { userId: user.id } });
    let workspace = {};
    try { workspace = JSON.parse(context?.recentFiles || "{}"); } catch (e) {}

    return NextResponse.json({ 
      sessions: chatSessions, 
      workspace,
      activeProject: context?.activeProject || "Untitled"
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

    let user = await prisma.user.findUnique({ where: { email: sbUser.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { id: sbUser.id, email: sbUser.email, name: sbUser.name || "User", credits: 50, plan: 'free' }
      });
    }

    // Credit system
    const cost = 5;
    if (user.plan !== 'pro' && user.credits < cost) {
       return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
    }

    const body = await req.json();
    const { messages, sessionId, attachments = [] } = body;
    const groqKeys = (process.env.GROQ_API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean);
    
    async function callGroq(payload: any) {
      for (const key of groqKeys) {
        try {
          const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", payload, {
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" }
          });
          return res.data;
        } catch (err: any) {
          console.error("GROQ API ERROR:", err.response?.data || err.message);
          if (err.response?.status === 429) continue;
          throw err;
        }
      }
    }

    const tools: any[] = [
      {
        type: "function",
        function: {
          name: "search_web",
          description: "Search the web for real-time info, news, or facts.",
          parameters: {
            type: "object",
            properties: { query: { type: "string", description: "The search query" } },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_youtube_v3",
          description: "Search YouTube to find Channels or Videos. Returns IDs and thumbnails.",
          parameters: {
            type: "object",
            properties: { 
              query: { type: "string", description: "Search query" },
              type: { type: "string", enum: ["video", "channel"] }
            },
            required: ["query", "type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "fetch_youtube_details",
          description: "Get precise stats and rich profile info for a YouTube ID.",
          parameters: {
            type: "object",
            properties: { 
              id: { type: "string", description: "ID" },
              type: { type: "string", enum: ["video", "channel"] }
            },
            required: ["id", "type"]
          }
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

    // Fetch or create UserContext
    let userContext = await prisma.userContext.findUnique({ where: { userId: user.id } });
    if (!userContext) {
      userContext = await prisma.userContext.create({ data: { userId: user.id } });
    }

    const contextStr = `USER CONTEXT (Past interactions & context):
- Preferences: ${userContext.preferences || 'None'}
- Long-term Memories: ${userContext.memories || 'None'}
- Last Updated: ${userContext.lastUpdated}
`;

    const systemPrompt = `You are Lumora AI, a world-class, highly intelligent, and slightly witty AI assistant. You possess the analytical depth of Claude and the sharp, direct personality of Grok.

CORE PERSONALITY:
- BE DIRECT: Give the most valuable answer first, then explain. No fluff.
- BE WITTY: Use subtle, intelligent humor where appropriate. Avoid being a generic "helpful assistant."
- BE PROACTIVE: Always think one step ahead. If a user asks about a problem, solve it and then suggest the logical next step or ask a smart follow-up question.
- BE CONFIDENT: You are a polymath. Act like it. Speak with authority but remain approachable.

RESPONSE STRUCTURE:
- USE MARKDOWN: Use bolding (**text**), clear headings (### Heading), and bullet points to make responses scannable.
- CODE BLOCKS: Always provide complete, production-ready code with appropriate language tags.
- VISUAL CLARITY: Use spacing and lists to ensure the user isn't overwhelmed by walls of text.

CAPABILITIES:
- REASONING: Break down complex problems step-by-step.
- CREATIVITY: Excel at storytelling and unique brainstorming.
- TOOLS: Use Search, YouTube, and Image tools when helpful. When using the generate_image tool, you MUST include the resulting image in your response using markdown syntax: ![Image Description](URL).

Current Context:
${contextStr}
`;

    const hasVision = attachments && Array.isArray(attachments) && attachments.some((a: any) => a.type?.startsWith('image/'));
    const model = hasVision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";

    console.log("Using model:", model, "Vision:", hasVision);

    // Strip unsupported properties for Groq API
    const cleanMessages = messages.map(({ role, content, tool_calls, tool_call_id, name }: any) => {
      const msg: any = { role, content };
      if (tool_calls) msg.tool_calls = tool_calls;
      if (tool_call_id) msg.tool_call_id = tool_call_id;
      if (name) msg.name = name;
      return msg;
    });

    let currentMessages = [{ role: "system", content: systemPrompt }, ...cleanMessages];
    
    if (hasVision) {
      const lastMsg = currentMessages[currentMessages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        const text = typeof lastMsg.content === 'string' ? lastMsg.content : "Explain this image";
        const content: any[] = [{ type: "text", text: text }];
        attachments.forEach((a: any) => {
          if (a.type?.startsWith('image/')) {
            content.push({ type: "image_url", image_url: { url: a.data } });
          } else if (a.type === 'application/pdf') {
            content[0].text += `\n\n[USER UPLOADED PDF: ${a.name || 'document'} - (Note: Currently processing as text context)]`;
          }
        });
        lastMsg.content = content;
      }
    }

    let totalTokens = 0;
    let iterations = 0;
    let lastAiMsg = null;
    const ytKey = process.env.YOUTUBE_API_KEY;

    while (iterations < 5) {
      iterations++;
      const payload: any = { model, messages: currentMessages, temperature: 0.5 };
      if (iterations < 5) { payload.tools = tools; payload.tool_choice = "auto"; }

      let data;
      try {
        console.log(`DEBUG: Call Groq (Iteration ${iterations}) with tools: ${!!payload.tools}`);
        data = await callGroq(payload);
        console.log(`DEBUG: Groq Response received.`);
      } catch (e: any) {
        // Fallback: If tool use fails or vision model has issues, retry without tools
        console.warn("DEBUG: API Error (Attempting fallback without tools):", e.response?.data || e.message);
        delete payload.tools;
        delete payload.tool_choice;
        data = await callGroq(payload);
      }
      lastAiMsg = data.choices[0].message;
      console.log(`DEBUG: Content: "${lastAiMsg.content?.substring(0, 50)}...", Tool calls: ${lastAiMsg.tool_calls?.length || 0}`);
      totalTokens += data.usage?.total_tokens || 0;

      if (lastAiMsg.tool_calls) {
        currentMessages.push(lastAiMsg);
        for (const tc of lastAiMsg.tool_calls) {
          const args = JSON.parse(tc.function.arguments);
          let content = "";
          try {
            if (tc.function.name === "search_web") {
              const res = await axios.post('https://google.serper.dev/search', { q: args.query }, { headers: { 'X-API-KEY': process.env.SERPER_API_KEY } });
              const results = res.data.organic?.slice(0, 6).map((r: any) => ({
                title: r.title,
                link: r.link,
                snippet: r.snippet
              })) || [];
              content = `WEB SEARCH RESULTS for "${args.query}":\n${results.map((r: any, i: number) => `[${i+1}] ${r.title}\nSource: ${r.link}\nSnippet: ${r.snippet}`).join('\n\n')}`;
            } else if (tc.function.name === "search_youtube_v3") {
              const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(args.query)}&type=${args.type}&maxResults=5&key=${ytKey}`;
              const res = await axios.get(url);
              const items = res.data.items.map((i: any) => ({
                title: i.snippet.title,
                id: args.type === "channel" ? i.id.channelId : i.id.videoId,
                pfp: i.snippet.thumbnails.high.url,
                type: args.type
              }));
              content = `YOUTUBE_SEARCH_RESULTS: ${JSON.stringify(items)}`;
            } else if (tc.function.name === "fetch_youtube_details") {
              const url = args.type === "video" 
                ? `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${args.id}&key=${ytKey}`
                : `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${args.id}&key=${ytKey}`;
              const res = await axios.get(url);
              const item = res.data.items?.[0];
              if (!item) content = "Not found.";
              else {
                const link = args.type === "channel" ? `https://youtube.com/channel/${args.id}` : `https://youtube.com/watch?v=${args.id}`;
                content = `Name: ${item.snippet.title}\nURL: ${link}\nCHANNEL_PFP: ${item.snippet.thumbnails.high.url}\nSubs: ${item.statistics.subscriberCount || 'N/A'}\nViews: ${item.statistics.viewCount}\nVideos: ${item.statistics.videoCount || 'N/A'}`;
              }
            } else if (tc.function.name === "generate_image") {
              content = `https://image.pollinations.ai/prompt/${encodeURIComponent(args.prompt)}?nologo=true`;
            } else if (tc.function.name === "initialize_project") {
              await prisma.userContext.update({
                where: { userId: user.id },
                data: { 
                  activeProject: args.name, 
                  recentFiles: "{}", // Clear old workspace for new project
                  lastUpdated: new Date() 
                }
              });
              content = `Project '${args.name}' initialized. You can now start creating files.`;
            } else if (tc.function.name === "manage_workspace") {
              let workspace: any = {};
              try { workspace = JSON.parse(userContext.recentFiles || "{}"); } catch (e) {}
              
              if (args.action === "list") {
                content = `WORKSPACE FILES:\n${Object.keys(workspace).join("\n") || "(Empty)"}`;
              } else if (args.action === "read") {
                content = workspace[args.path] ? `CONTENT OF ${args.path}:\n${workspace[args.path]}` : `File ${args.path} not found.`;
              } else if (args.action === "write") {
                workspace[args.path] = args.content;
                await prisma.userContext.update({
                  where: { userId: user.id },
                  data: { recentFiles: JSON.stringify(workspace), lastUpdated: new Date() }
                });
                content = `Successfully wrote to ${args.path}.`;
              } else if (args.action === "delete") {
                delete workspace[args.path];
                await prisma.userContext.update({
                  where: { userId: user.id },
                  data: { recentFiles: JSON.stringify(workspace), lastUpdated: new Date() }
                });
                content = `Deleted ${args.path}.`;
              }
            } else if (tc.function.name === "trigger_studio_tool") {
              content = `ACTION_TRIGGERED: ${JSON.stringify({ tool: args.toolName, task: args.taskDescription })}`;
            }
          } catch (e: any) { content = `Error: ${e.message}`; }
          currentMessages.push({ role: "tool", tool_call_id: tc.id, content });
        }
        continue;
      }
      break;
    }

    let finalAiContent = lastAiMsg.content || "";
    
    // If we have tool calls but no content, or just empty content, try one last time without tools
    if (!finalAiContent.trim() && iterations < 6) {
      console.log("DEBUG: Final response was empty, forcing one last call without tools.");
      const payload = { model, messages: currentMessages, temperature: 0.7 };
      const data = await callGroq(payload);
      finalAiContent = data.choices[0].message.content || "I apologize, but I encountered an issue generating a response. How else can I help?";
    }
    const finalMessages = [...messages, { role: "assistant", content: finalAiContent }];
    let activeSessionId = sessionId;
    if (activeSessionId) {
      await prisma.chatSession.update({ where: { id: activeSessionId }, data: { messages: JSON.stringify(finalMessages) } });
    } else {
      const firstMsg = messages.find((m: any) => m.role === 'user')?.content || "New Chat";
      const s = await prisma.chatSession.create({ data: { userId: user.id, title: firstMsg.substring(0, 40), messages: JSON.stringify(finalMessages) } });
      activeSessionId = s.id;
    }

    // Deduct credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: cost } }
    });

    return NextResponse.json({ message: finalAiContent, id: activeSessionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

