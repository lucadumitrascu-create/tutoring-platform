'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Group } from '@/types/database';
import { SkeletonCards } from '@/components/ui/Skeleton';

interface GroupWithCount extends Group {
  memberCount: number;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => { loadGroups(); }, []);

  async function loadGroups() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('groups')
        .select('*, group_members(count)')
        .order('created_at', { ascending: false }) as {
        data: (Group & { group_members: [{ count: number }] })[] | null;
      };

      if (data) {
        setGroups(data.map((g) => ({
          ...g,
          memberCount: g.group_members?.[0]?.count ?? 0,
        })));
      }
    } catch {
      setError('Nu s-au putut încărca grupurile.');
    }
    setLoading(false);
  }

  async function handleDelete(group: GroupWithCount) {
    if (!window.confirm(`Ștergi "${group.name}"? Toate postările, temele și întâlnirile din acest grup vor fi șterse.`)) return;
    setDeleting(group.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('groups').delete().eq('id', group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch {
      setError('Nu s-a putut șterge grupul.');
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2"><div className="animate-pulse bg-[#f0e8d8] rounded h-8 w-32" /><div className="animate-pulse bg-[#f0e8d8] rounded h-5 w-48" /></div>
          <div className="animate-pulse bg-[#f0e8d8] rounded-lg h-11 w-32" />
        </div>
        <SkeletonCards count={4} />
      </div>
    );
  }

  return (
    <div>
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-hand text-ink mb-1">Grupuri</h1>
          <p className="text-ink-lighter">Gestionează clasele tale.</p>
        </div>
        <Link href="/admin/groups/new" className="bg-sketch-dark text-white text-sm font-medium px-5 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Grup nou
        </Link>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-paper border border-sketch hover:border-sketch-dark rounded-2xl p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
              <h3 className="text-lg font-semibold text-ink mb-1">{group.name}</h3>
              <p className="text-sm text-ink-lighter line-clamp-2 mb-4 flex-1">{group.description || 'Fără descriere'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">{group.memberCount} {group.memberCount !== 1 ? 'membri' : 'membru'}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/groups/${group.id}`} className="text-sm text-sketch-dark font-medium hover:underline">
                    Gestionează
                  </Link>
                  <button
                    onClick={() => handleDelete(group)}
                    disabled={deleting === group.id}
                    className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50"
                  >
                    {deleting === group.id ? 'Se șterge...' : 'Șterge'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-paper border border-sketch border-dashed rounded-2xl p-8 sm:p-12 text-center">
          <svg className="w-12 h-12 text-sketch mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="text-ink-muted text-lg mb-2">Încă nu există grupuri</p>
          <Link href="/admin/groups/new" className="inline-block bg-sketch-dark text-white text-sm font-medium px-6 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150">
            Creează primul grup
          </Link>
        </div>
      )}
    </div>
  );
}
