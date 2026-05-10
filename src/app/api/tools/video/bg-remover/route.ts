import { NextRequest, NextResponse } from "next/server";
import { getEngineRoute } from "@/config/engine";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function POST(req: NextRequest) {
  const requestId = uuidv4();
  const tempDir = path.join(os.tmpdir(), `toolverse-video-${requestId}`);
  const framesInDir = path.join(tempDir, "frames_in");
  const framesOutDir = path.join(tempDir, "frames_out");

  try {
    const formData = await req.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // 1. Create temp directories
    await mkdir(tempDir, { recursive: true });
    await mkdir(framesInDir, { recursive: true });
    await mkdir(framesOutDir, { recursive: true });

    // 2. Save uploaded video
    const videoBuffer = Buffer.from(await file.arrayBuffer());
    const inputPath = path.join(tempDir, `input-${file.name}`);
    await writeFile(inputPath, videoBuffer);

    // 3. Extract frames using FFmpeg
    console.log("Extracting frames...");
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .on("end", resolve)
        .on("error", reject)
        .screenshots({
          count: 30, // For MVP/Demo: process first 30 frames to be fast
          folder: framesInDir,
          filename: "frame-%i.png",
        });
    });

    // 4. Process each frame with rembg microservice
    const frames = await readdir(framesInDir);
    console.log(`Processing ${frames.length} frames...`);

    for (const frame of frames) {
      const framePath = path.join(framesInDir, frame);
      const outFramePath = path.join(framesOutDir, frame);

      // Call the Python rembg microservice
      const form = new FormData();
      form.append("file", fs.createReadStream(framePath));

      try {
        const response = await axios.post(getEngineRoute("/image/remove-bg"), form, {
          headers: { ...form.getHeaders() },
          responseType: "arraybuffer",
        });

        await writeFile(outFramePath, response.data);
      } catch (err) {
        console.error(`Error processing frame ${frame}:`, err);
        // Fallback: just copy original if AI fails
        await writeFile(outFramePath, await fs.promises.readFile(framePath));
      }
    }

    // 5. Reassemble frames into video
    const outputPath = path.join(tempDir, "output.mp4");
    console.log("Reassembling video...");
    
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesOutDir, "frame-%d.png"))
        .inputFPS(24)
        .outputOptions("-c:v libx264")
        .outputOptions("-pix_fmt yuv420p")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    // 6. Read the final video and return
    const resultBuffer = await fs.promises.readFile(outputPath);
    
    // Cleanup
    // await rm(tempDir, { recursive: true, force: true });

    return new Response(resultBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="background-removed.mp4"',
      },
    });

  } catch (error: any) {
    console.error("Video processing error:", error);
    return NextResponse.json({ error: error.message || "Failed to process video" }, { status: 500 });
  }
}
