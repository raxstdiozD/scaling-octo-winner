import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabaseAdmin = createAdminClient();
    const { data: history, error } = await supabaseAdmin
      .from('UserFile')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[HISTORY_GET] Supabase Error:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error("[HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { toolType, originalName, originalUrl, resultUrl, fileType, status, metadata } = body;

    if (!originalName || !toolType) {
      return new NextResponse(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: historyItem, error } = await supabaseAdmin
      .from('UserFile')
      .insert({
        userId: user.id,
        toolType,
        originalName,
        originalUrl,
        resultUrl,
        fileType,
        status,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("[HISTORY_POST] Supabase Error:", error);
      throw error;
    }

    return NextResponse.json(historyItem);
  } catch (error: any) {
    console.error("[HISTORY_POST]", error);
    return new NextResponse(JSON.stringify({ error: error.message || "Internal Error" }), { status: 500 });
  }
}
