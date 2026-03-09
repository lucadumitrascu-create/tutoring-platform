'use client';

import Link from 'next/link';

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex flex-col bg-desk">
      {/* Top bar */}
      <div className="p-4 sm:p-6">
        <Link href="/" className="text-xl font-bold font-hand text-sketch-dark">
          TutorPlatform
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-paper shadow-sm border border-sketch p-8 text-center" style={{ borderRadius: '2px 8px 4px 6px' }}>
            <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-hand text-ink mb-2">Email confirmat!</h1>
            <p className="text-ink-lighter mb-6">
              Contul tău a fost verificat cu succes. Acum te poți autentifica.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-sketch-dark text-paper px-6 py-3 rounded-lg font-semibold hover:bg-ink transition-colors"
            >
              Mergi la autentificare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
