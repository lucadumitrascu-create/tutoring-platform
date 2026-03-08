'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Group, Assignment } from '@/types/database';
import { getGroupColor } from '@/lib/utils';
import { SkeletonCards } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface GroupWithProgress extends Group {
  totalAssignments: number;
  submittedAssignments: number;
}

export default function StudentGroupsPage() {
  const [groups, setGroups] = useState<GroupWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberships } = await (supabase as any)
        .from('group_members')
        .select('group:groups(*)')
        .eq('user_id', user.id) as { data: { group: Group }[] | null };

      const userGroups = (memberships ?? []).map((m) => m.group);

      if (userGroups.length > 0) {
        const groupIds = userGroups.map((g) => g.id);
        const [assignmentsRes, submissionsRes] = await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('assignments').select('id, group_id').in('group_id', groupIds) as Promise<{ data: Pick<Assignment, 'id' | 'group_id'>[] | null }>,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from('assignment_submissions').select('assignment_id').eq('student_id', user.id) as Promise<{ data: { assignment_id: string }[] | null }>,
        ]);

        const allAssignments = assignmentsRes.data ?? [];
        const submittedIds = new Set((submissionsRes.data ?? []).map((s) => s.assignment_id));

        setGroups(userGroups.map((g) => {
          const ga = allAssignments.filter((a) => a.group_id === g.id);
          return { ...g, totalAssignments: ga.length, submittedAssignments: ga.filter((a) => submittedIds.has(a.id)).length };
        }));
      } else {
        setGroups([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="space-y-2 mb-8">
          <div className="animate-pulse bg-gray-200 rounded h-8 w-40" />
          <div className="animate-pulse bg-gray-200 rounded h-5 w-56" />
        </div>
        <SkeletonCards count={4} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Groups</h1>
      <p className="text-gray-500 mb-8">Your enrolled classrooms.</p>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const color = getGroupColor(group.id);
            const progress = group.totalAssignments > 0 ? Math.round((group.submittedAssignments / group.totalAssignments) * 100) : 0;
            return (
              <Link key={group.id} href={`/groups/${group.id}`}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all block">
                <div className={`h-1.5 ${color.bg}`} />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{group.description || 'No description'}</p>
                  {group.totalAssignments > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{group.submittedAssignments}/{group.totalAssignments}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${color.bg}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
          title="No groups yet"
          description="Your teacher will add you to a group."
        />
      )}
    </div>
  );
}
