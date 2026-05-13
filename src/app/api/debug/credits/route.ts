import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * DEBUG ENDPOINT - Check user credits and auth
 * GET /api/debug/credits
 * 
 * Shows:
 * - Current user info
 * - Database credits
 * - Auth status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Not authenticated',
        message: 'You need to be logged in'
      }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`[DEBUG] Checking credits for user: ${userId}`)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        dailyCredits: true,
        lifetimeCredits: true,
        plan: true,
        creditsLastReset: true,
        createdAt: true,
      }
    })

    if (!user) {
      console.log(`[DEBUG] 🛠️ User not found in database. Initializing user record for: ${userId}`)
      
      const email = session.user.email
      const userName = session.user.user_metadata?.full_name || 
                       session.user.user_metadata?.name || 
                       email?.split('@')[0] || 'User'
      
      const newUser = await prisma.user.upsert({
        where: { id: userId },
        update: {
          aiMessagesToday: 0,
          aiMessagesReset: new Date(),
        },
        create: {
          id: userId,
          email: email || '',
          name: userName,
          dailyCredits: 50,
          lifetimeCredits: 0,
          plan: 'free',
          creditsLastReset: new Date(),
          aiMessagesToday: 0,
          aiMessagesReset: new Date(),
        }
      })

      return NextResponse.json({
        success: true,
        message: 'User record was missing and has been initialized with 50 credits',
        data: {
          auth: {
            userId: session.user.id,
            email: session.user.email,
          },
          database: {
            ...newUser,
            totalCredits: 50
          }
        }
      })
    }

    // Existing User - Auto-reset message count if they visit this page (for testing)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        aiMessagesToday: 0 // Reset message count for testing
      },
      select: {
        id: true,
        email: true,
        name: true,
        dailyCredits: true,
        lifetimeCredits: true,
        aiMessagesToday: true,
        plan: true,
        creditsLastReset: true,
        createdAt: true,
      }
    })

    console.log(`[DEBUG] User found and message count reset:`, updatedUser)

    return NextResponse.json({
      success: true,
      message: 'User found and AI message count has been reset to 0 for testing',
      data: {
        auth: {
          userId: session.user.id,
          email: session.user.email,
          authProvider: session.user.user_metadata?.provider || 'unknown'
        },
        database: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          dailyCredits: updatedUser.dailyCredits,
          lifetimeCredits: updatedUser.lifetimeCredits,
          aiMessagesToday: updatedUser.aiMessagesToday,
          totalCredits: updatedUser.dailyCredits + updatedUser.lifetimeCredits,
          plan: updatedUser.plan,
          creditsLastReset: updatedUser.creditsLastReset,
          createdAt: updatedUser.createdAt,
        }
      }
    })

  } catch (err) {
    console.error('[DEBUG] Error:', err)
    return NextResponse.json({
      error: 'Debug error',
      message: String(err)
    }, { status: 500 })
  }
}
