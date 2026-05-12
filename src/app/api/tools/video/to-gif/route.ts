import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;
    const start = formData.get("start") as string;
    const duration = formData.get("duration") as string;
    const fps = formData.get("fps") as string;
    const width = formData.get("width") as string;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const MODAL_URL = process.env.MODAL_VIDEO_URL ? `${process.env.MODAL_VIDEO_URL}/to-gif` : "https://syedrayangames--lumora-video-tools-fastapi-app.modal.run/to-gif";

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const response = await fetch(MODAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_name: file.name,
        file_data_base64: base64Data,
        start_time: parseFloat(start),
        duration: parseFloat(duration),
        fps: parseInt(fps),
        width: parseInt(width),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText || "GIF conversion failed" }, { status: 500 });
    }

    const result = await response.json();
    if (!result.success) {
      return NextResponse.json({ error: result.error || "GIF conversion failed" }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[VideoToGif] API Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
  }
}
