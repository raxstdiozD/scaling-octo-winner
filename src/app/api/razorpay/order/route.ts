import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/utils/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, currency = 'USD', amount: bodyAmount, tierId } = await req.json();
    
    // Default $6.99 USD (699 cents) for Pro
    let amount = 699;
    
    if (plan === 'credits' && bodyAmount) {
      amount = bodyAmount;
    } else if (currency === 'INR') {
      amount = 49900;
    }
    
    const options = {
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: user.id,
        plan: plan || 'pro',
        tierId: tierId || null
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
