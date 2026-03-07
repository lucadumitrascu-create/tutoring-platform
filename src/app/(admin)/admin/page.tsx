'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Lesson, User } from '@/types/database';

interface Stats {
  totalLessons: number;
  totalStudents: number;
  pendingHomework: number;
  accessGrants: number;
}

interface RecentAccess {
  id: string;
  created_at: string;
  user: User;
  lesson: Lesson;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalLessons: 0, totalStudents: 0, pendingHomework: 0, accessGrants: 0 });
  const [recentAccess, setRecentAccess] = useState<RecentAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      try {
      const [lessons, students, homework, purchases] = await Promise.all([
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('homework').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('purchases').select('id', { count: 'exact', head: true }),
      ]);

      // Fetch recent access grants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: accessData } = await (supabase as any)
        .from('purchases')
        .select('*, user:users(*), lesson:lessons(*)')
        .order('created_at', { ascending: false })
        .limit(10) as { data: RecentAccess[] | null };

      setStats({
        totalLessons: lessons.count ?? 0,
        totalStudents: students.count ?? 0,
        pendingHomework: homework.count ?? 0,
        accessGrants: purchases.count ?? 0,
      });
      setRecentAccess(accessData ?? []);
      } catch {
        setError('Failed to load dashboard data.');
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  const cards = [
    {
      label: 'Total Lessons',
      value: stats.totalLessons,
      formatted: String(stats.totalLessons),
      href: '/admin/lessons',
      color: 'bg-primary-100 text-primary-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      label: 'Students',
      value: stats.totalStudents,
      formatted: String(stats.totalStudents),
      href: '/admin/students',
      color: 'bg-green-100 text-green-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: 'Access Grants',
      value: stats.accessGrants,
      formatted: String(stats.accessGrants),
      href: '/admin/students',
      color: 'bg-emerald-100 text-emerald-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
    {
      label: 'Pending Reviews',
      value: stats.pendingHomework,
      formatted: String(stats.pendingHomework),
      href: '/admin/homework',
      color: 'bg-amber-100 text-amber-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of your tutoring platform.</p>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              {card.icon}
            </div>
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900">
              {card.formatted}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent access grants */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Access Grants</h2>
      {recentAccess.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 px-5 py-3">Student</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Lesson</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Price</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentAccess.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{p.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{p.user?.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{p.lesson?.title || 'Deleted lesson'}</td>
                  <td className="px-5 py-3 text-gray-700 hidden sm:table-cell">
                    {p.lesson?.is_free ? 'Free' : `$${(p.lesson?.price ?? 0).toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-8 text-center mb-10">
          <p className="text-gray-400">No access grants yet.</p>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/lessons/new"
          className="bg-primary-600 text-white rounded-xl p-6 hover:bg-primary-700 transition-colors"
        >
          <h3 className="font-semibold mb-1">Create New Lesson</h3>
          <p className="text-sm text-primary-200">Add a new lesson with materials and scheduling.</p>
        </Link>
        <Link
          href="/admin/homework"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Review Homework</h3>
          <p className="text-sm text-gray-500">Approve or reject student submissions.</p>
        </Link>
      </div>
    </div>
  );
}
