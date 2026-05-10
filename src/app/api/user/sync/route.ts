import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { PRICING_CONFIG } from '@/config/pricing';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch user from local Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.plan !== 'pro') {
      return NextResponse.json({ 
        error: 'No active Pro subscription found. Please upgrade to access Pro features.' 
      }, { status: 403 });
    }

    // 2. Fetch existing Supabase status to prevent accidental overwrites of 'cancelled'
    let { data: existingSupabaseUser } = await supabase
      .from('User')
      .select('subscription_status, plan_expires_at')
      .eq('id', user.id)
      .single();

    if (!existingSupabaseUser) {
      const { data: fallback } = await supabase
        .from('User')
        .select('subscription_status, plan_expires_at')
        .ilike('email', user.email!)
        .single();
      existingSupabaseUser = fallback;
    }

    const currentStatus = existingSupabaseUser?.subscription_status;
    const currentExpiry = existingSupabaseUser?.plan_expires_at;

    const dbStatus = dbUser.subscriptionStatus;
    const dbExpiry = dbUser.planExpiresAt;

    // Protection: If already cancelled in Supabase, preserve that status and expiry
    const newStatus = currentStatus === 'cancelled' || dbStatus === 'cancelled' 
      ? 'cancelled' 
      : (dbUser.plan === 'pro' ? 'active' : 'none');
    
    const newExpiry = currentExpiry || (dbExpiry ? dbExpiry.toISOString() : null);

    // 3. Sync to Supabase via Admin Client
    const supabaseAdmin = createAdminClient();
    
    // Build a safe payload based on columns we know exist from usePro/useCredits hooks
    const syncPayload: any = {
      id: user.id,
      email: user.email!,
      name: dbUser.name,
      plan: dbUser.plan,
      daily_credits: dbUser.plan === 'pro' ? PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS : 50,
      ai_messages_today: 0,
      // Use camelCase to match Prisma schema which likely created the Supabase table
      subscriptionId: dbUser.subscriptionId,
      subscriptionStatus: newStatus,
      aiGenerationsLimit: dbUser.aiGenerationsLimit
    };

    const { error: supabaseError } = await supabaseAdmin
      .from('User')
      .upsert(syncPayload, { onConflict: 'id' });

    if (supabaseError) {
      console.error('Sync to Supabase failed (Initial):', supabaseError);
      
      // Fallback: If camelCase fails, try a minimal update with just the essentials
      if (supabaseError.message.includes("column")) {
          const minimalPayload = {
              id: user.id,
              email: user.email!,
              plan: dbUser.plan,
              daily_credits: dbUser.plan === 'pro' ? PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS : 50
          };
          const { error: fallbackError } = await supabaseAdmin
            .from('User')
            .upsert(minimalPayload, { onConflict: 'id' });
            
          if (fallbackError) throw new Error(`Cloud sync failed: ${fallbackError.message}`);
      } else {
          throw new Error(`Cloud sync failed: ${supabaseError.message}`);
      }
    }

    if (supabaseError) {
      console.error('Sync to Supabase failed:', supabaseError);
      throw new Error(`Cloud sync failed: ${supabaseError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account synced successfully',
      user: {
        plan: dbUser.plan,
        credits: dbUser.plan === 'pro' ? PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS : 50
      }
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
