import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const lessonId = session.metadata?.lesson_id;
    const userId = session.metadata?.user_id;

    if (lessonId && userId) {
      const supabase = createServiceClient();

      // Check if purchase already exists (idempotency)
      const { data: existing } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle() as { data: { id: string } | null };

      if (!existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('purchases')
          .insert({
            user_id: userId,
            lesson_id: lessonId,
            stripe_session_id: session.id,
          });
      }
    }
  }

  return NextResponse.json({ received: true });
}
