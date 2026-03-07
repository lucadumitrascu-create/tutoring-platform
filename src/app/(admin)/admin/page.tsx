'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@/types/database';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single() as { data: User | null };

      if (profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUser(profile);
      setLoading(false);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="text-xl font-bold text-primary-700">
            TutorPlatform <span className="text-xs font-normal text-gray-400">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.full_name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">Manage your lessons, students, and homework.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/lessons"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Lessons</h3>
            <p className="text-sm text-gray-500">Create and manage your lessons.</p>
          </Link>

          <Link
            href="/admin/students"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Students</h3>
            <p className="text-sm text-gray-500">View enrolled students.</p>
          </Link>

          <Link
            href="/admin/homework"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Homework</h3>
            <p className="text-sm text-gray-500">Review and grade submissions.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
