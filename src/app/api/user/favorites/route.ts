import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const { data: { user: sbUser } } = await supabaseServer.auth.getUser();

    if (!sbUser) {
      return NextResponse.json({ favorites: [] }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('Favorite')
      .select('toolId')
      .eq('userId', sbUser.id);

    if (error) {
      console.error("[Favorites] Fetch error:", error);
      return NextResponse.json({ favorites: [] });
    }

    return NextResponse.json({ favorites: data.map(f => f.toolId) });
  } catch (error: any) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const { data: { user: sbUser } } = await supabaseServer.auth.getUser();

    if (!sbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolId, action } = await req.json();

    if (!toolId || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    if (action === 'add') {
      const { error } = await supabaseAdmin
        .from('Favorite')
        .upsert({
          userId: sbUser.id,
          toolId: toolId
        }, { onConflict: 'userId,toolId' });
      
      if (error) console.error("[Favorites] Add error:", error);
    } else {
      const { error } = await supabaseAdmin
        .from('Favorite')
        .delete()
        .eq('userId', sbUser.id)
        .eq('toolId', toolId);
      
      if (error) console.error("[Favorites] Remove error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating favorite:", error);
    return NextResponse.json({ error: "Failed to update favorite" }, { status: 500 });
  }
}
