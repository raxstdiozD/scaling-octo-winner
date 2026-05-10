import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { createNotification } from '@/lib/notifications';
import { sendProWelcomeEmail, sendCreditsPurchasedEmail } from '@/lib/emails';
import { PRICING_CONFIG } from '@/config/pricing';

/**
 * Example usage in /api/razorpay/success route
 * This route is called after a successful payment verification.
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      razorpay_payment_id, 
      razorpay_order_id,
      plan,
      amount
    } = await req.json();

    // 1. Logic to update the user plan/credits in the database
    // (Assuming verification was already done or is done here)
    
    if (plan === 'pro') {
      // Update Prisma
      await prisma.user.update({
        where: { email: user.email! },
        data: { 
          plan: 'pro',
          subscriptionStatus: 'active',
          credits: { increment: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS }
        },
      });

      // Update Supabase
      await supabase
        .from('User')
        .update({ 
          plan: 'pro', 
          subscription_status: 'active',
          daily_credits: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS 
        })
        .eq('id', user.id);

      // 2. Trigger Success Email (Async - don't block the response)
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      
      sendProWelcomeEmail(user.email!, {
        invoiceId: `INV-${razorpay_payment_id.slice(-8).toUpperCase()}`,
        amount: amount || `$${PRICING_CONFIG.PRO_PLAN.USD}`,
        date: nextBillingDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      }).catch(err => console.error('Failed to send welcome email:', err));

      // 3. Create In-app Notification
      await createNotification(
        user.id,
        'Pro Activated 🚀',
        'Welcome to Lumora Pro! Your premium features are now unlocked.',
        'success'
      ).catch(err => console.error('Notification failed:', err));

    } else if (plan === 'credits') {
      const isINR = razorpay_order_id?.includes('inr') || (amount && amount.includes('₹'));
      const tierIndex = razorpay_order_id?.includes('tier_1') ? 0 : 
                       razorpay_order_id?.includes('tier_2') ? 1 : 2;
      const tier = PRICING_CONFIG.CREDIT_PACKAGES[tierIndex];

      await prisma.user.update({
        where: { email: user.email! },
        data: { lifetimeCredits: { increment: tier.credits } },
      });

      sendCreditsPurchasedEmail(user.email!, {
        credits: tier.credits,
        amount: amount || (isINR ? `₹${tier.priceINR}` : `$${tier.priceUSD}`),
        invoiceId: `INV-${razorpay_payment_id.slice(-8).toUpperCase()}`
      }).catch(err => console.error('Failed to send credits email:', err));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment processed and email sent' 
    });

  } catch (error: any) {
    console.error('Success route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
