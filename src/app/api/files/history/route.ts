import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

// GET recent history
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const history = await prisma.userFile.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        lastAccessed: "desc",
      },
      take: limit,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("[HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST new history item
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { fileName, filePath, fileType, content } = body;

    if (!fileName || !filePath) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const historyItem = await prisma.userFile.upsert({
      where: {
        userId_filePath: {
          userId: user.id,
          filePath: filePath,
        },
      },
      update: {
        lastAccessed: new Date(),
        content: content,
      },
      create: {
        userId: user.id,
        fileName,
        filePath,
        fileType,
        content,
      },
    });

    return NextResponse.json(historyItem);
  } catch (error) {
    console.error("[HISTORY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
