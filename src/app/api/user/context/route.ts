import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user = await prisma.user.findUnique({ where: { id: sbUser.id } });
    if (!user) return NextResponse.json({ context: null });

    const context = await prisma.userContext.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({ 
      context: context,
      activeProject: context?.activeProject || "Untitled"
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    
    if (!sbUser || !sbUser.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { preferences, memories, activeProject, recentFiles } = body;

    let user = await prisma.user.findUnique({ where: { id: sbUser.id } });
    if (!user) {
        user = await prisma.user.create({
            data: { id: sbUser.id, email: sbUser.email, name: sbUser.user_metadata?.full_name || "User" }
        });
    }

    const context = await prisma.userContext.upsert({
      where: { userId: user.id },
      update: { 
        preferences, 
        memories, 
        activeProject, 
        recentFiles,
        lastUpdated: new Date() 
      },
      create: { 
        userId: user.id, 
        preferences, 
        memories, 
        activeProject, 
        recentFiles 
      }
    });

    return NextResponse.json({ success: true, context });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
