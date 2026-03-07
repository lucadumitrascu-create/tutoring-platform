'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Group } from '@/types/database';

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
      setError('Failed to load groups.');
    }
    setLoading(false);
  }

  async function handleDelete(group: GroupWithCount) {
    if (!window.confirm(`Delete "${group.name}"? All posts, assignments, and meetings in this group will be deleted.`)) return;
    setDeleting(group.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('groups').delete().eq('id', group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch {
      setError('Failed to delete group.');
    }
    setDeleting(null);
  }

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
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Groups</h1>
          <p className="text-gray-500">Manage your classrooms.</p>
        </div>
        <Link href="/admin/groups/new" className="bg-primary-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Group
        </Link>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{group.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/groups/${group.id}`} className="text-sm text-primary-600 font-medium hover:underline">
                    Manage
                  </Link>
                  <button
                    onClick={() => handleDelete(group)}
                    disabled={deleting === group.id}
                    className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50"
                  >
                    {deleting === group.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="text-gray-400 text-lg mb-2">No groups yet</p>
          <Link href="/admin/groups/new" className="inline-block bg-primary-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors">
            Create First Group
          </Link>
        </div>
      )}
    </div>
  );
}
