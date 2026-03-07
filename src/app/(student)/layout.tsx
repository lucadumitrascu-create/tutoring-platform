'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import type { AccessStatus } from '@/types/database';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAccess() {
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
        setAuthorized(true);
        setLoading(false);
        return;
      }

      if (profile.access_status !== 'approved') {
        router.push('/request-access');
        return;
      }

      setAuthorized(true);
      setLoading(false);
    }
    checkAccess();
  }, []);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
