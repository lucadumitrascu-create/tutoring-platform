'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';
import type { Lesson } from '@/types/database';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadPurchase() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      const { data: purchase } = await supabase
        .from('purchases')
        .select('*, lesson:lessons(*)')
        .eq('stripe_session_id', sessionId)
        .maybeSingle() as { data: { lesson: Lesson } | null };

      if (purchase) {
        setLesson(purchase.lesson);
      }
      setLoading(false);
    }

    // Small delay to allow webhook to process
    const timer = setTimeout(loadPurchase, 1500);
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
      <p className="text-gray-500 mb-8">
        {loading
          ? 'Processing your purchase...'
          : lesson
          ? `You now have full access to "${lesson.title}".`
          : 'Your purchase has been confirmed.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {lesson && (
          <Link
            href={`/lessons/${lesson.id}`}
            className="bg-primary-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Lesson
          </Link>
        )}
        <Link
          href="/dashboard"
          className="bg-white border border-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
