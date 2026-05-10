import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { session } } = await supabaseServer.auth.getSession();

    if (!session || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, username } = await req.json();

    // 1. Basic Validation
    if (username && (username.length < 3 || username.length > 20)) {
      return NextResponse.json({ error: "Username must be between 3 and 20 characters." }, { status: 400 });
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 2. Uniqueness Check & Suggestions
    if (username) {
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('User')
        .select('id, email')
        .eq('username', username)
        .maybeSingle();

      if (checkError) console.error("Username check error:", checkError);

      if (existingUser && existingUser.id !== session.user.id) {
        const suggestions = [
          `${username}${Math.floor(Math.random() * 999)}`,
          `${username}_pro`,
          `${username}_${new Date().getFullYear()}`
        ];
        return NextResponse.json({ 
          error: "Username already taken.", 
          suggestions 
        }, { status: 409 });
      }
    }

    // 3. Update Supabase User Table
    const updateData: any = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Profile DB Update Error:", updateError);
      // If the record doesn't exist in 'User' table yet, create it
      if (updateError.code === 'PGRST116' || updateError.message.includes("No rows found")) {
        await supabaseAdmin.from('User').insert({
          id: session.user.id,
          email: session.user.email,
          ...updateData
        });
      }
    }

    // 4. Update Supabase Auth Metadata (for name/display)
    if (name || username) {
      await supabaseServer.auth.updateUser({
        data: { 
          full_name: name || session.user.user_metadata?.full_name,
          username: username || session.user.user_metadata?.username
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
