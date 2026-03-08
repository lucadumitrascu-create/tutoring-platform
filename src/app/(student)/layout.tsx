'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import type { AccessStatus } from '@/types/database';
import { SkeletonLine } from '@/components/ui/Skeleton';

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
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton navbar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <SkeletonLine className="h-6 w-32" />
            <div className="hidden sm:flex gap-2">
              <SkeletonLine className="h-8 w-20 rounded-lg" />
              <SkeletonLine className="h-8 w-20 rounded-lg" />
              <SkeletonLine className="h-8 w-16 rounded-lg" />
            </div>
            <SkeletonLine className="h-8 w-24 hidden sm:block" />
          </div>
        </div>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-4">
            <SkeletonLine className="h-8 w-64" />
            <SkeletonLine className="h-5 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                  <SkeletonLine className="h-5 w-2/3" />
                  <SkeletonLine className="h-4 w-full" />
                  <SkeletonLine className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </main>
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
