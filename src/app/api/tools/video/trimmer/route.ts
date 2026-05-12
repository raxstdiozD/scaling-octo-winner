import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, rm, readFile } from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

// --- FFmpeg Path Configuration for Windows (Local Fallback) ---
const setupFfmpeg = () => {
  if (process.env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    return;
  }
  const commonPaths = [
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    path.join(process.cwd(), "bin", "ffmpeg.exe"),
    path.join(process.cwd(), "python-api", "ffmpeg.exe"), // Found in python-api
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      ffmpeg.setFfmpegPath(p);
      return;
    }
  }
};
setupFfmpeg();

export async function POST(req: NextRequest) {
  const requestId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `toolverse-trimmer-${requestId}`);
  
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;
    const start = formData.get("start") as string;
    const end = formData.get("end") as string;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const startTime = parseFloat(start) || 0;
    const endTime = parseFloat(end);
    const duration = endTime - startTime;

    // Check if we should use Modal
    const MODAL_URL = process.env.MODAL_VIDEO_URL ? `${process.env.MODAL_VIDEO_URL}/trim` : null;

    if (MODAL_URL) {
      console.log(`[VideoTrimmer] Using Modal backend: ${MODAL_URL}`);
      
      // Convert file to base64
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString("base64");

      const response = await fetch(MODAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_data_base64: base64Data,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`Modal backend error: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Modal processing failed");
      }

      const resultBuffer = Buffer.from(result.file_data_base64.split(",")[1], "base64");

      return new Response(resultBuffer, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": `attachment; filename="trimmed_${file.name.replace(/\.[^/.]+$/, "")}.mp4"`,
        },
      });
    }

    // --- Local Fallback ---
    console.log(`[VideoTrimmer] Using local FFmpeg backend`);
    await mkdir(tempDir, { recursive: true });
    const videoBuffer = Buffer.from(await file.arrayBuffer());
    const inputPath = path.join(tempDir, `input-${file.name}`);
    await writeFile(inputPath, videoBuffer);
    const outputPath = path.join(tempDir, `trimmed-${file.name}`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions([
          "-c:v libx264",
          "-preset superfast",
          "-crf 23",
          "-c:a aac",
          "-b:a 128k",
          "-movflags +faststart"
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    const resultBuffer = await readFile(outputPath);
    rm(tempDir, { recursive: true, force: true }).catch(() => {});

    return new Response(resultBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="trimmed_${file.name.replace(/\.[^/.]+$/, "")}.mp4"`,
      },
    });

  } catch (error: any) {
    console.error("[VideoTrimmer] Error:", error);
    return NextResponse.json({ error: error.message || "Processing failed" }, { status: 500 });
  }
}
