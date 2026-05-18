import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (!sbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let currentUser = await prisma.user.findUnique({
        where: { id: sbUser.id }
    });

    if (!currentUser) {
        currentUser = await prisma.user.create({
            data: {
                id: sbUser.id,
                email: sbUser.email!,
                name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0],
                dailyCredits: 50
            }
        });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const prompt = file ? await file.text() : "";

    if (!prompt) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    // Determine System Prompt based on ToolId
    let systemPrompt = "You are a professional AI assistant. Provide high-quality and accurate output.";
    
    if (toolId === "summarizer") {
      systemPrompt = "You are an expert content summarizer. Provide a concise and clear summary of the input while retaining all key information.";
    } else if (toolId === "translator") {
      systemPrompt = "You are a master translator. Accurately translate the following text into the requested language, maintaining the original tone and context.";
    } else if (toolId === "code-gen") {
      systemPrompt = "You are a senior software engineer. Generate clean, efficient, and well-documented code based on the user's requirements. Provide only the code block.";
    } else if (toolId === "chat") {
      systemPrompt = "You are a friendly and intelligent AI assistant. Engage in conversation and help the user with their needs.";
    } else if (toolId === "slides") {
      systemPrompt = "You are a professional presentation architect. Create a detailed outline and content for a slide deck based on the user's topic. Structure the response with Slide titles and bullet points.";
    } else if (toolId === "writer") {
      systemPrompt = "You are a professional writer. Create engaging, well-structured, and creative content based on the user's prompt.";
    }

    // Call Groq Cloud API
    try {
      if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY missing");
      }

      const groqResponse = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        },
        {
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const generatedText = groqResponse.data.choices[0].message.content;

      // Sync & Check Credits from Prisma
      const dailyCredits = currentUser.dailyCredits ?? 0;
      const lifetimeCredits = currentUser.lifetimeCredits ?? 0;
      const totalCreditsAvailable = dailyCredits + lifetimeCredits;
      const cost = 2;

      if (totalCreditsAvailable < cost) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
      }

      // Deduct Credits (Sync with Prisma)
      let newLifetime = lifetimeCredits;
      let newDaily = dailyCredits;

      if (newLifetime >= cost) {
        newLifetime -= cost;
      } else {
        const remaining = cost - newLifetime;
        newLifetime = 0;
        newDaily -= remaining;
      }

      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          lifetimeCredits: newLifetime,
          dailyCredits: newDaily
        }
      });

      return NextResponse.json({ 
        success: true, 
        result: generatedText 
      });

    } catch (groqError: any) {
      console.error(`AI Core Error [${toolId}]:`, groqError.response?.data || groqError.message);
      return NextResponse.json({ error: "Inference failed." }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`Fatal AI Core Error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
