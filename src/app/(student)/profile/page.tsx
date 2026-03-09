'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@/types/database';
import { SkeletonLine } from '@/components/ui/Skeleton';

interface ProfileStats {
  groupsEnrolled: number;
  assignmentsSubmitted: number;
  postsRead: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ groupsEnrolled: 0, assignmentsSubmitted: 0, postsRead: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single() as { data: User | null };

      setUser(profile);

      // Fetch stats in parallel
      const [membershipsRes, submissionsRes, readsRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('group_members').select('id', { count: 'exact', head: true }).eq('user_id', authUser.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('assignment_submissions').select('id', { count: 'exact', head: true }).eq('student_id', authUser.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('post_reads').select('id', { count: 'exact', head: true }).eq('user_id', authUser.id),
      ]);

      setStats({
        groupsEnrolled: membershipsRes.count ?? 0,
        assignmentsSubmitted: submissionsRes.count ?? 0,
        postsRead: readsRes.count ?? 0,
      });

      setLoading(false);
    }
    load();
  }, []);

  const accessStatusMap: Record<string, { label: string; bg: string; text: string }> = {
    approved: { label: 'Activ', bg: 'bg-green-100', text: 'text-green-700' },
    pending: { label: 'În așteptare', bg: 'bg-amber-100', text: 'text-amber-700' },
    none: { label: 'Fără acces', bg: 'bg-[#f0e8d8]', text: 'text-ink' },
    rejected: { label: 'Respins', bg: 'bg-red-100', text: 'text-red-700' },
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <SkeletonLine className="h-8 w-32 mb-8" />
        <div className="bg-paper border border-sketch rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <SkeletonLine className="h-16 w-16 rounded-full" />
            <div className="space-y-2"><SkeletonLine className="h-5 w-40" /><SkeletonLine className="h-4 w-48" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-2"><SkeletonLine className="h-8 w-12 mx-auto" /><SkeletonLine className="h-4 w-20 mx-auto" /></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statusCfg = accessStatusMap[user.access_status] || accessStatusMap.none;

  const statItems = [
    { label: 'Grupuri', value: stats.groupsEnrolled },
    { label: 'Teme trimise', value: stats.assignmentsSubmitted },
    { label: 'Lecții citite', value: stats.postsRead },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-ink mb-8 font-hand">Profil</h1>

      <div className="bg-paper border border-sketch rounded-2xl overflow-hidden">
        {/* User info */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#f0e8d8] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-sketch-dark">
                {user.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">{user.full_name}</h2>
              <p className="text-sm text-ink-lighter">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {statItems.map((stat) => (
              <div key={stat.label} className="bg-[#f0e8d8] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-ink">{stat.value}</p>
                <p className="text-xs text-ink-lighter mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Account details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-ink-lighter">Stare</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-sketch-light">
              <span className="text-sm text-ink-lighter">Rol</span>
              <span className="text-sm text-ink capitalize">{user.role === 'student' ? 'Elev' : user.role === 'admin' ? 'Administrator' : user.role}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-sketch-light">
              <span className="text-sm text-ink-lighter">Înscris</span>
              <span className="text-sm text-ink">
                {new Date(user.created_at).toLocaleDateString('ro-RO', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
