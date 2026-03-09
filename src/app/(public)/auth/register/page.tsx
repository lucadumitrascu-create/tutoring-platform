'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const errorMessages: Record<string, string> = {
  'User already registered': 'Un cont cu acest email există deja.',
  'Password should be at least 6 characters': 'Parola trebuie să aibă cel puțin 6 caractere.',
  'Unable to validate email address: invalid format': 'Introdu o adresă de email validă.',
};

function friendlyError(msg: string): string {
  return errorMessages[msg] || msg;
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
        },
        emailRedirectTo: `${window.location.origin}/api/auth/confirm-callback`,
      },
    });

    if (error) {
      setError(friendlyError(error.message));
      setLoading(false);
      return;
    }

    router.push('/request-access');
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
            <h1 className="text-2xl font-bold font-hand text-ink mb-1">Creează-ți contul</h1>
            <p className="text-ink-lighter mb-8">Începe-ți călătoria de învățare astăzi.</p>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Nume complet
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-sketch rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark text-ink placeholder:text-ink-muted"
                  placeholder="Ion Popescu"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Parolă
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
                  Confirmă parola
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-sketch rounded-lg focus:outline-none focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark text-ink placeholder:text-ink-muted"
                  placeholder="Repetă parola"
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
                    Se creează contul...
                  </span>
                ) : (
                  'Creează cont'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-sketch-light text-center">
              <p className="text-sm text-ink-lighter">
                Ai deja un cont?{' '}
                <Link href="/auth/login" className="text-sketch-dark font-medium hover:underline">
                  Autentifică-te
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
