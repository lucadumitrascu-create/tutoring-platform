'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { User, Group, Meeting, Assignment, AssignmentSubmission } from '@/types/database';
import { getGreeting, getRelativeTime, getGroupColor } from '@/lib/utils';
import { SkeletonLine, SkeletonCards } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface GroupWithProgress extends Group {
  totalAssignments: number;
  submittedAssignments: number;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  deadline: string;
  groupName: string;
  groupId: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<GroupWithProgress[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<(Meeting & { groupName: string })[]>([]);
  const [urgentDeadlines, setUrgentDeadlines] = useState<UpcomingDeadline[]>([]);
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: memberships } = await (supabase as any)
          .from('group_members')
          .select('group:groups(*)')
          .eq('user_id', authUser.id) as { data: { group: Group }[] | null };

        const userGroups = (memberships ?? []).map((m) => m.group);

        if (userGroups.length > 0) {
          const groupIds = userGroups.map((g) => g.id);

          // Fetch meetings, assignments, submissions in parallel
          const [meetingsRes, assignmentsRes, submissionsRes] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase as any).from('meetings').select('*, group:groups(name)').in('group_id', groupIds).gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(5) as Promise<{ data: (Meeting & { group: { name: string } })[] | null }>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase as any).from('assignments').select('*, group:groups(name)').in('group_id', groupIds) as Promise<{ data: (Assignment & { group: { name: string } })[] | null }>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase as any).from('assignment_submissions').select('assignment_id').eq('student_id', authUser.id) as Promise<{ data: { assignment_id: string }[] | null }>,
          ]);

          setUpcomingMeetings((meetingsRes.data ?? []).map((m) => ({ ...m, groupName: m.group?.name || '' })));

          const allAssignments = assignmentsRes.data ?? [];
          const submittedIds = new Set((submissionsRes.data ?? []).map((s) => s.assignment_id));

          // Urgent deadlines (< 48h, not submitted)
          const now = new Date();
          const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
          const urgent = allAssignments
            .filter((a) => a.deadline && !submittedIds.has(a.id) && new Date(a.deadline) > now && new Date(a.deadline) <= in48h)
            .map((a) => ({ id: a.id, title: a.title, deadline: a.deadline!, groupName: a.group?.name || '', groupId: a.group_id }));
          setUrgentDeadlines(urgent);

          // Group progress
          const groupsWithProgress: GroupWithProgress[] = userGroups.map((g) => {
            const groupAssignments = allAssignments.filter((a) => a.group_id === g.id);
            const submitted = groupAssignments.filter((a) => submittedIds.has(a.id));
            return { ...g, totalAssignments: groupAssignments.length, submittedAssignments: submitted.length };
          });
          setGroups(groupsWithProgress);
        } else {
          setGroups(userGroups.map((g) => ({ ...g, totalAssignments: 0, submittedAssignments: 0 })));
        }
      } catch {
        setError('Failed to load dashboard data.');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <SkeletonLine className="h-8 w-72" />
          <SkeletonLine className="h-5 w-48" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 space-y-2"><SkeletonLine className="h-4 w-3/4" /><SkeletonLine className="h-3 w-1/2" /></div>
              <SkeletonLine className="h-9 w-16 rounded-lg" />
            </div>
          ))}
        </div>
        <SkeletonCards count={3} />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {getGreeting()}, {user?.full_name || 'Student'}!
      </h1>
      <p className="text-gray-500 mb-8">Here&apos;s your learning dashboard.</p>

      {/* Urgent Deadline Banner */}
      {urgentDeadlines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 mb-8">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800 mb-1">Deadline-uri Aproape!</p>
              <div className="space-y-1.5">
                {urgentDeadlines.map((d) => (
                  <Link key={d.id} href={`/groups/${d.groupId}/assignments/${d.id}`}
                    className="flex items-center justify-between gap-2 text-sm text-red-700 hover:text-red-900 transition-colors">
                    <span className="truncate">{d.title} <span className="text-red-400">({d.groupName})</span></span>
                    <span className="flex-shrink-0 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{getRelativeTime(d.deadline)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h2>
          <div className="space-y-2">
            {upcomingMeetings.map((m) => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm hover:border-gray-300 transition-all">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-primary-600 font-medium">{m.groupName}</span>
                    <span className="text-xs text-gray-400">{new Date(m.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{getRelativeTime(m.scheduled_at)}</span>
                  </div>
                </div>
                <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                  className="bg-primary-600 text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center">
                  Join
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Groups</h2>
          <Link href="/groups" className="text-sm text-primary-600 font-medium hover:underline">View all</Link>
        </div>
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => {
              const color = getGroupColor(group.id);
              const progress = group.totalAssignments > 0 ? Math.round((group.submittedAssignments / group.totalAssignments) * 100) : 0;
              return (
                <Link key={group.id} href={`/groups/${group.id}`}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                  <div className={`h-1.5 ${color.bg}`} />
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
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
    </div>
  );
}
