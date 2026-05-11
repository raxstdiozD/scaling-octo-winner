import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') || searchParams.get('returnUrl') || '/'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && session?.user?.email) {
      const { prisma } = await import('@/lib/prisma')
      const { sendWelcomeEmail } = await import('@/lib/emails')
      
      const existingUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (!existingUser) {
        // Send Welcome Email for New Users
        sendWelcomeEmail(session.user.email).catch(err => console.error('Welcome email failed:', err))
      }

      await prisma.user.upsert({
        where: { email: session.user.email },
        update: {},
        create: {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
          dailyCredits: 50,
          plan: 'free'
        }
      })

      // Also ensure Supabase User table is in sync
      const { createAdminClient } = await import('@/utils/supabase/admin')
      const supabaseAdmin = createAdminClient()
      await supabaseAdmin.from('User').upsert({
        email: session.user.email,
        daily_credits: 50,
        plan: 'free'
      }, { onConflict: 'email' })
      const forwardedHost = request.headers.get('x-forwarded-host') // i.e. local.vercel.live
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can skip the check on local dev
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
