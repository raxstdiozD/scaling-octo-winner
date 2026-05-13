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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { action, amount, reason } = await request.json()

    if (!action || !amount) {
      return NextResponse.json(
        { error: 'Missing action or amount' },
        { status: 400 }
      )
    }

    let result
    if (action === 'deduct') {
      result = await deductCredits(userId, amount)
    } else if (action === 'add') {
      result = await addCredits(userId, amount, reason)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "deduct" or "add"' },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (err) {
    console.error('[API] Error processing credits:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
