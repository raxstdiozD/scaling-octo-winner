import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;
    const language = formData.get("language") as string;
    const burn = formData.get("burn") === "true";

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const MODAL_URL = process.env.MODAL_VIDEO_URL ? `${process.env.MODAL_VIDEO_URL}/subtitles` : "https://syedrayangames--lumora-video-tools-fastapi-app.modal.run/subtitles";

    console.log(`[SubtitleGenerator] Calling Modal: ${MODAL_URL} (Language: ${language}, Burn: ${burn})`);

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const response = await fetch(MODAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_name: file.name,
        file_data_base64: base64Data,
        language: language,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SubtitleGenerator] Modal error:", errorText);
      throw new Error(`Cloud processing failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Subtitle generation failed");
    }

    return NextResponse.json({
      srt: result.srt,
      videoUrl: result.file_data_base64,
    });

  } catch (error: any) {
    console.error("[SubtitleGenerator] Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" }, 
      { status: 500 }
    );
  }
}
