import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;
    const quality = formData.get("quality") as string;
    const format = formData.get("format") as string;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const MODAL_URL = process.env.MODAL_VIDEO_URL ? `${process.env.MODAL_VIDEO_URL}/compress` : null;

    if (!MODAL_URL) {
      // In a real app, you might fall back to local FFmpeg here
      return NextResponse.json({ error: "Cloud backend not configured" }, { status: 500 });
    }

    console.log(`[VideoCompressor] Calling Modal: ${MODAL_URL} (Quality: ${quality}, Format: ${format})`);

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const response = await fetch(MODAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_name: file.name,
        file_data_base64: base64Data,
        quality: quality,
        format: format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[VideoCompressor] Modal error:", errorText);
      throw new Error(`Cloud processing failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Compression failed");
    }

    const resultBuffer = Buffer.from(result.file_data_base64.split(",")[1], "base64");

    return new Response(resultBuffer, {
      headers: {
        "Content-Type": `video/${format}`,
        "Content-Disposition": `attachment; filename="${result.file_name}"`,
        "Content-Length": resultBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("[VideoCompressor] Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" }, 
      { status: 500 }
    );
  }
}
