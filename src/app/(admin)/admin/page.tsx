'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { User } from '@/types/database';

interface Stats {
  totalGroups: number;
  totalStudents: number;
  pendingSubmissions: number;
  pendingRequests: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalGroups: 0, totalStudents: 0, pendingSubmissions: 0, pendingRequests: 0 });
  const [pendingStudents, setPendingStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [groups, students, submissions, pending] = await Promise.all([
        (supabase as any).from('groups').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        (supabase as any).from('assignment_submissions').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('access_status', 'pending'),
      ]);

      const { data: pendingData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('access_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10) as { data: User[] | null };

      setStats({
        totalGroups: groups.count ?? 0,
        totalStudents: students.count ?? 0,
        pendingSubmissions: submissions.count ?? 0,
        pendingRequests: pending.count ?? 0,
      });
      setPendingStudents(pendingData ?? []);
    } catch {
      setError('Failed to load dashboard data.');
    }
    setLoading(false);
  }

  async function handleAction(studentId: string, action: 'approve' | 'reject') {
    setActionLoading(`${studentId}-${action}`);
    setError('');

    try {
      const res = await fetch('/api/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `Failed to ${action}.`);
      } else {
        await loadStats();
      }
    } catch {
      setError(`Failed to ${action}.`);
    }
    setActionLoading(null);
  }

  const cards = [
    {
      label: 'Total Groups',
      value: stats.totalGroups,
      href: '/admin/groups',
      color: 'bg-primary-100 text-primary-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      label: 'Students',
      value: stats.totalStudents,
      href: '/admin/students',
      color: 'bg-green-100 text-green-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending Requests',
      value: stats.pendingRequests,
      href: '/admin/students',
      color: 'bg-amber-100 text-amber-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending Reviews',
      value: stats.pendingSubmissions,
      href: '/admin/groups',
      color: 'bg-emerald-100 text-emerald-700',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
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
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Pending requests */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Access Requests</h2>
      {pendingStudents.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 px-5 py-3">Student</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Joined</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{student.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{student.email}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
                    {new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleAction(student.id, 'approve')} disabled={actionLoading !== null}
                        className="text-xs bg-green-600 text-white font-medium px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50">
                        {actionLoading === `${student.id}-approve` ? 'Approving...' : 'Approve'}
                      </button>
                      <button onClick={() => handleAction(student.id, 'reject')} disabled={actionLoading !== null}
                        className="text-xs bg-red-600 text-white font-medium px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50">
                        {actionLoading === `${student.id}-reject` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-8 text-center mb-10">
          <p className="text-gray-400">No pending requests.</p>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/groups/new" className="bg-primary-600 text-white rounded-xl p-6 hover:bg-primary-700 transition-colors">
          <h3 className="font-semibold mb-1">Create New Group</h3>
          <p className="text-sm text-primary-200">Set up a new classroom for your students.</p>
        </Link>
        <Link href="/admin/groups" className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-gray-900 mb-1">Manage Groups</h3>
          <p className="text-sm text-gray-500">View and manage all your classrooms.</p>
        </Link>
      </div>
    </div>
  );
}
