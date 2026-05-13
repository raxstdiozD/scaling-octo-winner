import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserCredits, deductCredits, addCredits } from '@/lib/credits'

/**
 * GET /api/user/credits
 * Fetch current user's credits (with automatic daily reset check)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const credits = await getUserCredits(userId)

    if (!credits) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        dailyCredits: credits.dailyCredits,
        lifetimeCredits: credits.lifetimeCredits,
        totalCredits: credits.dailyCredits + credits.lifetimeCredits,
        aiMessagesToday: credits.aiMessagesToday,
        plan: credits.plan,
        lastReset: credits.creditsLastReset,
      }
    })
  } catch (err) {
    console.error('[API] Error fetching credits:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/credits
 * Deduct or add credits
 * 
 * Body:
 * {
 *   action: 'deduct' | 'add',
 *   amount: number,
 *   reason?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user?.id) {
      console.error('[API] Auth error or no session:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { action, amount, reason } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    console.log(`[API] Processing credit action: ${action} for user: ${userId}`)

    let result: any = { success: true }
    
    try {
      if (action === 'deduct') {
        result = await deductCredits(userId, amount || 0)
      } else if (action === 'add') {
        result = await addCredits(userId, amount || 0, reason)
      } else if (action === 'consume-message') {
        // Logic for incrementing AI message count (Unlimited with Safety Bypass)
        const now = new Date()
        try {
          const updated = await prisma.user.upsert({
            where: { id: userId },
            update: {
              aiMessagesToday: { increment: 1 },
              updatedAt: now
            },
            create: {
              id: userId,
              dailyCredits: 50,
              lifetimeCredits: 0,
              aiMessagesToday: 1,
              plan: 'free',
              createdAt: now,
              updatedAt: now
            },
            select: { aiMessagesToday: true }
          })
          result = { success: true, data: updated }
        } catch (dbErr) {
          console.error('[API] CRITICAL: Database error during message consumption:', dbErr)
          // SAFETY BYPASS: Return success even if DB update fails so user isn't blocked
          return NextResponse.json({ success: true, bypass: true })
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid action. Use "deduct", "add", or "consume-message"' },
          { status: 400 }
        )
      }
    } catch (actionErr) {
      console.error(`[API] Error performing action ${action}:`, actionErr)
      if (action === 'consume-message') {
        return NextResponse.json({ success: true, bypass: true })
      }
      throw actionErr
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data || result })
  } catch (err) {
    console.error('[API] Global POST error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    )
  }
}
