import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendPaymentFailedEmail } from '@/lib/emails';

/**
 * Example usage in /api/razorpay/failure route
 * This route is called when a payment fails or is cancelled.
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger Failure Email
    // We call this even if we don't have detailed payment info to let the user know
    // no charge was made and they can try again.
    sendPaymentFailedEmail(user.email!).catch(err => 
      console.error('Failed to send failure email:', err)
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Failure email triggered' 
    });

  } catch (error: any) {
    console.error('Failure route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
