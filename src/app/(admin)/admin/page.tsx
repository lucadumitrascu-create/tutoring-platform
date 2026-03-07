'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Lesson, User } from '@/types/database';

interface Stats {
  totalLessons: number;
  totalStudents: number;
  pendingHomework: number;
  totalRevenue: number;
}

interface RecentPurchase {
  id: string;
  created_at: string;
  user: User;
  lesson: Lesson;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalLessons: 0, totalStudents: 0, pendingHomework: 0, totalRevenue: 0 });
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      const [lessons, students, homework] = await Promise.all([
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('homework').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      ]);

      // Fetch recent purchases
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: purchasesData } = await (supabase as any)
        .from('purchases')
        .select('*, user:users(*), lesson:lessons(*)')
        .order('created_at', { ascending: false })
        .limit(10) as { data: RecentPurchase[] | null };

      // Calculate total revenue from all purchases
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allPurchases } = await (supabase as any)
        .from('purchases')
        .select('lesson:lessons(price)') as { data: { lesson: { price: number } }[] | null };

      const totalRevenue = allPurchases
        ? allPurchases.reduce((sum: number, p: { lesson: { price: number } }) => sum + (p.lesson?.price ?? 0), 0)
        : 0;

      setStats({
        totalLessons: lessons.count ?? 0,
        totalStudents: students.count ?? 0,
        pendingHomework: homework.count ?? 0,
        totalRevenue,
      });
      setRecentPurchases(purchasesData ?? []);
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
      label: 'Total Revenue',
      value: stats.totalRevenue,
      formatted: `$${stats.totalRevenue.toFixed(2)}`,
      href: '/admin/students',
      color: 'bg-emerald-100 text-emerald-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of your tutoring platform.</p>

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
              {loading ? '—' : card.formatted}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent purchases */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchases</h2>
      {recentPurchases.length > 0 ? (
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
              {recentPurchases.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{p.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{p.user?.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{p.lesson?.title || 'Deleted lesson'}</td>
                  <td className="px-5 py-3 text-gray-700 hidden sm:table-cell">
                    ${(p.lesson?.price ?? 0).toFixed(2)}
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
          <p className="text-gray-400">No purchases yet.</p>
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
