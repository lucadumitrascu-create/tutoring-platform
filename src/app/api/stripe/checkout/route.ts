import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase-server';
import type { Lesson } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get lesson details
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single() as { data: Lesson | null };

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (lesson.is_free) {
      return NextResponse.json({ error: 'This lesson is free' }, { status: 400 });
    }

    // Check if already purchased
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle() as { data: { id: string } | null };

    if (existing) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 });
    }

    // Create Stripe Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: lesson.title,
              description: lesson.description || undefined,
            },
            unit_amount: Math.round(lesson.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        lesson_id: lessonId,
        user_id: user.id,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel?lesson_id=${lessonId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
