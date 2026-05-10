import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createNotification } from '@/lib/notifications';
import { sendProWelcomeEmail, sendCreditsPurchasedEmail, sendPaymentFailedEmail } from '@/lib/emails';
import { PRICING_CONFIG } from '@/config/pricing';

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    const { 
      razorpay_order_id,
      razorpay_payment_id, 
      razorpay_signature,
      plan,
      tierId,
      isINR
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // 1. Update DB based on plan
      if (plan === 'credits') {
        const tier = PRICING_CONFIG.CREDIT_PACKAGES.find(t => t.id === tierId) || PRICING_CONFIG.CREDIT_PACKAGES[0];
        const creditsToAdd = tier.credits;
        
        await prisma.user.upsert({
          where: { id: user.id },
          update: { 
            lifetimeCredits: { increment: creditsToAdd }
          },
          create: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
            lifetimeCredits: creditsToAdd,
            credits: 50,
            plan: 'free'
          }
        });

        // 2. Update Supabase with fallback
        const { data: profile } = await supabaseAdmin
          .from('User')
          .select('lifetime_credits')
          .eq('id', user.id)
          .single();
          
        const currentCredits = profile?.lifetime_credits || 0;

        const creditsPayload: any = {
            id: user.id,
            email: user.email!,
            lifetime_credits: currentCredits + creditsToAdd
        };

        const { error: sbError } = await supabaseAdmin
          .from('User') 
          .upsert(creditsPayload, { onConflict: 'id' });

        if (sbError) console.error('[Razorpay] Supabase credits update failed:', sbError);

        // Send Credits Email (Async)
        const finalIsINR = isINR || razorpay_order_id.includes('inr');
        const tierIndex = PRICING_CONFIG.CREDIT_PACKAGES.findIndex(t => t.id === tierId);
        const finalTier = tierIndex !== -1 ? PRICING_CONFIG.CREDIT_PACKAGES[tierIndex] : tier;

        sendCreditsPurchasedEmail(user.email!, {
          credits: finalTier.credits,
          amount: finalIsINR ? `₹${finalTier.priceINR}` : `$${finalTier.priceUSD}`,
          invoiceId: `INV-${razorpay_payment_id.slice(-8).toUpperCase()}`
        }).catch(err => {
          console.error('Credits email failed:', err);
          // If it fails, it's likely a Resend config/domain issue
        });

      } else {
        // Default to Pro upgrade
        // 1. Update/Upsert in Prisma (Local DB)
        await prisma.user.upsert({
          where: { email: user.email! },
          update: { 
            plan: 'pro',
            subscriptionId: razorpay_order_id,
            subscriptionStatus: 'active',
            aiGenerationsLimit: 1000,
            credits: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS // Also sync Prisma credits
          },
          create: {
            email: user.email!,
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            plan: 'pro',
            subscriptionId: razorpay_order_id,
            subscriptionStatus: 'active',
            aiGenerationsLimit: 1000,
            credits: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS
          }
        });

        // 2. Update/Upsert in Supabase (Real-time DB) via Admin Client (bypass RLS)
        const proPayload: any = {
            id: user.id,
            email: user.email!,
            plan: 'pro',
            planType: 'PRO',
            subscriptionId: razorpay_order_id,
            subscriptionStatus: 'active',
            aiGenerationsLimit: 1000,
            daily_credits: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS,
            ai_messages_today: 0
        };

        const { error: sbError } = await supabaseAdmin
          .from('User') 
          .upsert(proPayload, { onConflict: 'id' });

        if (sbError) {
          console.error('[Razorpay] Supabase Pro activation failed (Initial):', sbError);
          
          // Fallback: If column mismatch, try minimal update
          if (sbError.message.includes("column")) {
              const minimalProPayload = {
                  id: user.id,
                  email: user.email!,
                  plan: 'pro',
                  daily_credits: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS
              };
              const { error: fbError } = await supabaseAdmin
                .from('User')
                .upsert(minimalProPayload, { onConflict: 'id' });
                
              if (fbError) {
                  console.error('[Razorpay] Supabase Fallback failed:', fbError);
                  return NextResponse.json({ 
                    success: false, 
                    error: 'Cloud database update failed', 
                    details: fbError.message 
                  }, { status: 500 });
              }
          } else {
              return NextResponse.json({ 
                success: false, 
                error: 'Cloud database update failed', 
                details: sbError.message 
              }, { status: 500 });
          }
        }
        
        console.log(`[Razorpay] Successfully activated Pro for ${user.email}`);

        // Send Welcome Email (Async)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        
        sendProWelcomeEmail(user.email!, {
          invoiceId: `INV-${razorpay_payment_id.slice(-8).toUpperCase()}`,
          amount: (isINR || razorpay_order_id.includes('inr')) ? `₹${PRICING_CONFIG.PRO_PLAN.INR}` : `$${PRICING_CONFIG.PRO_PLAN.USD}`,
          date: nextBillingDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })
        }).catch(err => console.error('Welcome email failed:', err));
      }

      try {
        await createNotification(
          user.id,
          plan === 'credits' ? 'Reserve Refueled ⚡' : 'Pro Activated 🚀',
          plan === 'credits' ? 'Permanent credits added to your reserve.' : 'Welcome to the elite club! You now have unlimited access.',
          'success'
        );
      } catch (notifError) {
        console.error('Notification failed:', notifError);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified and account updated' 
      });
    } else {
      // Signature verification failed - Payment might be suspicious or failed
      // We can send a failure email here as well
      await sendPaymentFailedEmail(user.email!).catch(err => 
        console.error('Failure email failed:', err)
      );

      return NextResponse.json({ 
        success: false, 
        message: 'Invalid signature' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
