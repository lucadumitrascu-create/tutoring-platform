'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { User, Lesson, Purchase } from '@/types/database';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [purchasedLessons, setPurchasedLessons] = useState<(Purchase & { lesson: Lesson })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single() as { data: User | null };

        setUser(profile);

        // Fetch purchased lessons
        const { data: purchases } = await supabase
          .from('purchases')
          .select('*, lesson:lessons(*)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false }) as { data: (Purchase & { lesson: Lesson })[] | null };

        setPurchasedLessons(purchases ?? []);
      } catch {
        setError('Failed to load dashboard data.');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {user?.full_name || 'Student'}!
      </h1>
      <p className="text-gray-500 mb-8">Here&apos;s your learning dashboard.</p>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <Link
          href="/lessons"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Browse Lessons</h3>
          <p className="text-sm text-gray-500">Find and purchase new lessons.</p>
        </Link>
      </div>

      {/* Purchased lessons */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Lessons</h2>
        {purchasedLessons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchasedLessons.map((p) => (
              <Link
                key={p.id}
                href={`/lessons/${p.lesson.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{p.lesson.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.lesson.description}</p>
                {p.lesson.scheduled_at && (
                  <p className="text-xs text-primary-600 font-medium">
                    Live: {new Date(p.lesson.scheduled_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 border-dashed rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-3">You haven&apos;t purchased any lessons yet.</p>
            <Link href="/lessons" className="text-primary-600 font-medium text-sm hover:underline">
              Browse available lessons &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
