'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AccessStatus } from '@/types/database';

export default function RequestAccessPage() {
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('access_status, role')
        .eq('id', user.id)
        .single() as { data: { access_status: AccessStatus; role: string } | null };

      if (!profile) {
        router.push('/auth/login');
        return;
      }

      if (profile.role === 'admin') {
        router.push('/admin');
        return;
      }

      if (profile.access_status === 'approved') {
        router.push('/dashboard');
        return;
      }

      setAccessStatus(profile.access_status);
      setLoading(false);
    }
    checkStatus();
  }, []);

  const handleRequestAccess = async () => {
    setRequesting(true);
    setError('');

    try {
      const res = await fetch('/api/access', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to request access.');
        setRequesting(false);
        return;
      }
      setAccessStatus('pending');
    } catch {
      setError('Failed to request access.');
    }
    setRequesting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="p-4 sm:p-6">
        <Link href="/" className="text-xl font-bold text-primary-700">
          TutorPlatform
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {accessStatus === 'pending' ? (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Request Pending</h1>
                <p className="text-gray-500 text-center mb-6">
                  Your access request has been submitted. We&apos;ll review it shortly. Please check back later.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Check Status
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Get Access</h1>
                <p className="text-gray-500 text-center mb-8">
                  To access all lessons and materials, please make a bank transfer and then request access below.
                </p>

                {accessStatus === 'rejected' && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>Your previous request was rejected. You can request access again after making the payment.</span>
                  </div>
                )}

                {/* IBAN Info */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Transfer Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">IBAN</span>
                      <span className="font-mono font-medium text-gray-900">RO00 XXXX 0000 0000 0000 0000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Beneficiary</span>
                      <span className="font-medium text-gray-900">TutorPlatform SRL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-medium text-gray-900">Banca X</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleRequestAccess}
                  disabled={requesting}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {requesting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Requesting...
                    </span>
                  ) : (
                    'Request Access'
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  After making the transfer, click the button above. Your access will be approved once the payment is confirmed.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
