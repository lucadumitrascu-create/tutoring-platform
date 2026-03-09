'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { User } from '@/types/database';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

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
      setError('Nu s-au putut încărca datele panoului.');
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
        setError(data.error || `Acțiunea ${action} a eșuat.`);
      } else {
        await loadStats();
      }
    } catch {
      setError(`Acțiunea ${action} a eșuat.`);
    }
    setActionLoading(null);
  }

  const cards = [
    {
      label: 'Total grupuri',
      value: stats.totalGroups,
      href: '/admin/groups',
      color: 'bg-[#f0e8d8] text-sketch-dark',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      label: 'Elevi',
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
      label: 'Cereri în așteptare',
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
      label: 'Recenzii în așteptare',
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
    return <SkeletonDashboard />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-hand text-ink mb-1">Panou principal</h1>
      <p className="text-ink-lighter mb-8">Prezentare generală a platformei de meditații.</p>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-paper border border-sketch rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              {card.icon}
            </div>
            <p className="text-sm text-ink-lighter mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-ink">{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Pending requests */}
      <h2 className="text-lg font-semibold font-hand text-ink mb-4">Cereri de acces în așteptare</h2>
      {pendingStudents.length > 0 ? (
        <div className="bg-paper border border-sketch rounded-2xl overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sketch-light">
                <th className="text-left font-medium text-ink-lighter px-5 py-3">Elev</th>
                <th className="text-left font-medium text-ink-lighter px-5 py-3 hidden sm:table-cell">Înscris</th>
                <th className="text-right font-medium text-ink-lighter px-5 py-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {pendingStudents.map((student) => (
                <tr key={student.id} className="border-b border-sketch-light/50 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{student.full_name || 'Necunoscut'}</p>
                    <p className="text-xs text-ink-muted">{student.email}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-muted hidden sm:table-cell">
                    {new Date(student.created_at).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleAction(student.id, 'approve')} disabled={actionLoading !== null}
                        className="text-xs bg-green-600 text-white font-medium px-3.5 py-2 min-h-[36px] sm:min-h-0 rounded-md hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
                        {actionLoading === `${student.id}-approve` ? 'Se aprobă...' : 'Aprobă'}
                      </button>
                      <button onClick={() => handleAction(student.id, 'reject')} disabled={actionLoading !== null}
                        className="text-xs bg-red-600 text-white font-medium px-3.5 py-2 min-h-[36px] sm:min-h-0 rounded-md hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50">
                        {actionLoading === `${student.id}-reject` ? 'Se respinge...' : 'Respinge'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-paper border border-sketch border-dashed rounded-2xl p-8 text-center mb-10">
          <p className="text-ink-muted">Nu există cereri în așteptare.</p>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-lg font-semibold font-hand text-ink mb-4">Acțiuni rapide</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/groups/new" className="bg-sketch-dark text-white rounded-2xl p-6 hover:bg-ink active:scale-[0.98] transition-all duration-200">
          <h3 className="font-semibold mb-1">Creează un grup nou</h3>
          <p className="text-sm text-paper">Configurează o nouă clasă pentru elevii tăi.</p>
        </Link>
        <Link href="/admin/groups" className="bg-paper border border-sketch hover:border-sketch-dark rounded-2xl p-6 hover:shadow-md active:scale-[0.98] transition-all duration-200">
          <h3 className="font-semibold text-ink mb-1">Gestionează grupurile</h3>
          <p className="text-sm text-ink-lighter">Vizualizează și gestionează toate clasele tale.</p>
        </Link>
      </div>
    </div>
  );
}
