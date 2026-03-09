'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Session should already exist — the callback route exchanged the code
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Fallback: listen for auth state change in case session is still loading
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
            setSessionReady(true);
            subscription.unsubscribe();
          }
        });
        // Timeout — if no session after 5s, show error
        setTimeout(() => {
          if (!sessionReady) {
            setError('Linkul de resetare a expirat sau este invalid. Încearcă din nou.');
            setSessionReady(true); // show the form with error
          }
        }, 5000);
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }

    if (password.length < 6) {
      setError('Parola trebuie sa aiba cel putin 6 caractere.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
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
            {success ? (
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold font-hand text-ink mb-2">Parola a fost schimbata cu succes!</h1>
                <p className="text-ink-lighter mb-6">
                  Vei fi redirectionat catre pagina de autentificare in cateva secunde.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block text-sm text-sketch-dark font-medium hover:underline"
                >
                  Mergi la autentificare
                </Link>
              </div>
            ) : !sessionReady ? (
              <div className="text-center py-8">
                <svg className="animate-spin w-8 h-8 text-sketch-dark mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-ink-lighter">Se verifica linkul de resetare...</p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold font-hand text-ink mb-1">Parola noua</h1>
                <p className="text-ink-lighter mb-6">
                  Alege o parola noua pentru contul tau.
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Parola noua
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 border border-sketch rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark text-ink placeholder:text-ink-muted pr-12"
                        placeholder="Min. 6 caractere"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-light"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Confirma parola noua
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-sketch rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark text-ink placeholder:text-ink-muted"
                      placeholder="Repeta parola noua"
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
                        Se actualizeaza...
                      </span>
                    ) : (
                      'Schimba parola'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-sketch-light text-center">
                  <Link href="/auth/login" className="text-sm text-sketch-dark font-medium hover:underline">
                    Inapoi la autentificare
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
