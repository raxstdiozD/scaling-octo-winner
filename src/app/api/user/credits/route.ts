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
    } else if (action === 'consume-message') {
      // 1. Check if user is Pro
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      })

      // 2. If user is FREE, check if any PRO users are active right now (last 5 minutes)
      if (user?.plan === 'free') {
        const activeProUsers = await prisma.user.count({
          where: {
            plan: 'pro',
            updatedAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Active in last 5 mins
            }
          }
        })

        // If there are active Pro users, simulate a "busy" state for Free users (20% chance)
        // or always block if you want strict priority. Let's do 30% chance of "busy".
        if (activeProUsers > 0 && Math.random() < 0.3) {
          return NextResponse.json(
            { error: 'High traffic: Pro users have priority' },
            { status: 429 }
          )
        }
      }

      // 3. Logic for incrementing AI message count (Unlimited)
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          aiMessagesToday: { increment: 1 }
        },
        select: { aiMessagesToday: true }
      })
      result = { success: true, data: updated }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "deduct", "add", or "consume-message"' },
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
