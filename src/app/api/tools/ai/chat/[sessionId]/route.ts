import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, props: { params: Promise<{ sessionId: string }> }) {
  try {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();


    if (!sbUser || !sbUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { email: sbUser.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: params.sessionId }
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (chatSession.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let parsedMessages = [];
    try {
      parsedMessages = JSON.parse(chatSession.messages);
    } catch (e) {
      console.error("Failed to parse messages JSON", e);
    }

    return NextResponse.json({ 
      id: chatSession.id, 
      title: chatSession.title, 
      messages: parsedMessages
    });
  } catch (error) {
    console.error("Fetch session error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ sessionId: string }> }) {
  try {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();

    if (!sbUser || !sbUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: sbUser.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: params.sessionId }
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (chatSession.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.chatSession.delete({
      where: { id: params.sessionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
