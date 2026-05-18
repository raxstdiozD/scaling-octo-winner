import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (!sbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const prompt = file ? await file.text() : "";

    if (!prompt) {
      return NextResponse.json({ error: "No URL or text provided" }, { status: 400 });
    }

    // Use a reliable QR Generation API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(prompt)}`;

    // Simple credit deduction
    try {
        const user = await prisma.user.findUnique({ where: { id: sbUser.id } });
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { dailyCredits: { decrement: 1 } }
            });
        }
    } catch (e) {
        console.warn("Credit deduction failed, but proceeding with QR generation.");
    }

    return NextResponse.json({ 
      success: true, 
      result: qrUrl 
    });

  } catch (error: any) {
    console.error(`QR Gen Error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
