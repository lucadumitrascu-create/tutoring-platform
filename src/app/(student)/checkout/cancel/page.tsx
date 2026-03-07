'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CancelContent() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('lesson_id');

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
      <p className="text-gray-500 mb-8">
        Your payment was not processed. You can try again whenever you&apos;re ready.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {lessonId && (
          <Link
            href={`/lessons/${lessonId}`}
            className="bg-primary-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </Link>
        )}
        <Link
          href="/lessons"
          className="bg-white border border-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Browse Lessons
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}
