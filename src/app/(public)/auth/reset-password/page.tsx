'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/auth/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-desk">
      {/* Top bar */}
      <div className="p-4 sm:p-6">
        <Link href="/" className="text-xl font-bold text-sketch-dark">
          TutorPlatform
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-paper shadow-sm border border-sketch p-8" style={{ borderRadius: '2px 8px 4px 6px' }}>
            {sent ? (
              <>
                <div className="text-center">
                  <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold font-hand text-ink mb-2">Email trimis!</h1>
                  <p className="text-ink-lighter mb-6">
                    Verifica-ti email-ul pentru linkul de resetare.
                  </p>
                  <p className="text-sm text-ink-muted mb-6">
                    Daca nu gasesti email-ul, verifica si folderul de spam.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block text-sm text-sketch-dark font-medium hover:underline"
                  >
                    Inapoi la autentificare
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold font-hand text-ink mb-1">Resetare parola</h1>
                <p className="text-ink-lighter mb-6">
                  Introdu adresa de email asociata contului tau si iti vom trimite un link de resetare.
                </p>

                <form onSubmit={handleReset} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-sketch rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark text-ink placeholder:text-ink-muted"
                      placeholder="you@example.com"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sketch-dark text-paper py-3 rounded-lg font-semibold hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Se trimite...
                      </span>
                    ) : (
                      'Trimite linkul de resetare'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-sketch-light text-center">
                  <p className="text-sm text-ink-lighter">
                    Ti-ai amintit parola?{' '}
                    <Link href="/auth/login" className="text-sketch-dark font-medium hover:underline">
                      Autentifica-te
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
