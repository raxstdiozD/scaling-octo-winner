import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(messages: any[]) {
  const keys = process.env.GROQ_API_KEYS?.split(",").map(k => k.trim()) || [];
  if (keys.length === 0) throw new Error("No Groq API keys configured");

  let lastError: any = null;
  for (const key of keys) {
    try {
      const response = await axios.post(
        GROQ_API_URL,
        { 
          model: "llama-3.3-70b-versatile", 
          messages, 
          temperature: 0.7, 
          max_tokens: 1024 
        },
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

export async function POST(req: NextRequest) {
  try {
    const { section, role, context } = await req.json();

    let prompt = "";
    if (section === "experience") {
      prompt = `Write 3-4 professional, impact-driven bullet points for a ${role} role. 
Context: ${context || "Standard professional responsibilities"}
Focus on achievements, metrics (if possible), and strong action verbs.
Make it ATS-friendly. Return only the bullet points.`;
    } else if (section === "summary") {
      prompt = `Write a compelling 2-3 sentence professional summary for a ${role}.
Context: ${context || "Experienced professional"}
Highlight key strengths and career goals. Return only the summary text.`;
    } else if (section === "skills") {
      prompt = `Return ONLY a comma-separated list of 10-15 professional skills for a ${role}. 
Context: ${context || ""}
Rules:
- NO introductory text.
- NO full sentences.
- NO "Here are some skills".
- ONLY return the skills separated by commas.
- Each skill should be 1-3 words maximum.`;
    } else {
      prompt = `Provide professional content suggestions for a resume ${section} section related to a ${role}. 
Context: ${context || ""}`;
    }

    const response = await callGroq([
      { role: "system", content: "You are an expert career coach and professional resume writer." },
      { role: "user", content: prompt }
    ]);

    return NextResponse.json({ 
      success: true, 
      suggestion: response.choices[0].message.content.trim() 
    });
  } catch (error: any) {
    console.error("Resume Suggest Error:", error.message);
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 });
  }
}
