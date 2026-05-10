import { NextRequest } from "next/server";
import { withToolHandler } from "@/lib/tools-handler";
import { PDFDocument } from "pdf-lib";
import { writeFile } from "fs/promises";
import path from "path";

const STORAGE_PATH = path.join(process.cwd(), "public", "results");

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const toolId = url.pathname.split('/').pop() || "merger";

  return withToolHandler(req, {
    toolId: `pdf-${toolId}`,
    allowedTypes: ["application/pdf"],
    maxSize: 50 * 1024 * 1024, // 50MB
    creditCost: 1
  }, async (buffer, jobId, formData) => {
    
    const fileName = `result_${jobId}.pdf`;
    const fullPath = path.join(STORAGE_PATH, fileName);

    if (toolId === "splitter") {
      // Split Logic: Extract first page for mock demo
      const pdfDoc = await PDFDocument.load(buffer);
      const newPdf = await PDFDocument.create();
      const [firstPage] = await newPdf.copyPages(pdfDoc, [0]);
      newPdf.addPage(firstPage);
      const pdfBytes = await newPdf.save();
      await writeFile(fullPath, pdfBytes);
    } else {
      // Merger Logic (Simulated for single file upload in demo)
      // In real multi-file merger, we'd handle multiple files from formData
      await writeFile(fullPath, buffer);
    }

    return {
      resultUrl: `/results/${fileName}`
    };
  });
}
