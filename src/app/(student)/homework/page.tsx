'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Assignment, AssignmentSubmission } from '@/types/database';
import { getRelativeTime, assignmentStatusConfig } from '@/lib/utils';
import { SkeletonLine, SkeletonList } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

type FilterTab = 'all' | 'pending' | 'submitted';

interface AssignmentWithGroup extends Assignment {
  groupName: string;
}

export default function HomeworkPage() {
  const supabase = createClient();

  const [assignments, setAssignments] = useState<AssignmentWithGroup[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }


      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, group:groups(name)')
        .eq('user_id', user.id) as { data: { group_id: string; group: { name: string } }[] | null };

      const groupIds = memberships?.map((m) => m.group_id) || [];
      const groupNameMap: Record<string, string> = {};
      memberships?.forEach((m) => { groupNameMap[m.group_id] = m.group?.name || 'Unknown'; });

      if (groupIds.length === 0) { setLoading(false); return; }


      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*')
        .in('group_id', groupIds)
        .order('deadline', { ascending: true, nullsFirst: false }) as { data: Assignment[] | null };

      const withGroup: AssignmentWithGroup[] = (assignmentData ?? []).map((a) => ({
        ...a,
        groupName: groupNameMap[a.group_id] || 'Unknown',
      }));
      setAssignments(withGroup);


      const { data: subData } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id) as { data: AssignmentSubmission[] | null };

      setSubmissions(subData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function getStatus(a: Assignment): 'pending' | 'submitted' | 'approved' | 'rejected' {
    const sub = submissions.find((s) => s.assignment_id === a.id);
    if (!sub) return 'pending';
    return sub.status;
  }

  const sortOrder: Record<string, number> = { pending: 0, submitted: 1, rejected: 2, approved: 3 };

  const filtered = assignments
    .filter((a) => {
      const status = getStatus(a);
      if (filter === 'pending') return status === 'pending' || status === 'rejected';
      if (filter === 'submitted') return status === 'submitted';
      return true;
    })
    .sort((a, b) => sortOrder[getStatus(a)] - sortOrder[getStatus(b)]);

  const pendingCount = assignments.filter((a) => getStatus(a) === 'pending' || getStatus(a) === 'rejected').length;
  const submittedCount = assignments.filter((a) => getStatus(a) === 'submitted').length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'Toate', count: assignments.length },
    { key: 'pending', label: 'De făcut', count: pendingCount },
    { key: 'submitted', label: 'Trimise', count: submittedCount },
  ];

  if (loading) {
    return (
      <div>
        <SkeletonLine className="h-8 w-48 mb-2" />
        <SkeletonLine className="h-5 w-64 mb-6" />
        <SkeletonLine className="h-10 w-72 rounded-lg mb-6" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1 font-hand">Teme</h1>
      <p className="text-ink-lighter mb-6">Toate temele tale din toate grupurile.</p>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-[#f0e8d8] rounded-lg p-1 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${filter === t.key ? 'bg-paper text-ink shadow-sm' : 'text-ink-lighter hover:text-ink'}`}>
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 text-xs opacity-60">({t.count})</span>}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((a) => {
            const status = getStatus(a);
            const config = assignmentStatusConfig[status];
            const isOverdue = a.deadline && new Date(a.deadline) < new Date() && status === 'pending';
            return (
              <Link key={a.id} href={`/groups/${a.group_id}/assignments/${a.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-paper border border-sketch rounded-2xl px-5 py-4 hover:shadow-sm hover:border-sketch active:scale-[0.99] transition-all">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink">{a.title}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-ink-muted">{a.groupName}</span>
                    {a.deadline && (
                      <>
                        <span className="text-sketch">·</span>
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-ink-muted'}`}>
                          {isOverdue ? 'Întârziat' : `Termen: ${new Date(a.deadline).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                          {!isOverdue && a.deadline && new Date(a.deadline) > new Date() && (
                            <span className="ml-1.5 text-ink-muted">({getRelativeTime(a.deadline)})</span>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-sketch flex-shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            );
          })}
        </div>
      ) : assignments.length > 0 ? (
        <p className="text-ink-muted text-sm text-center py-8">Nicio temă nu corespunde filtrului selectat.</p>
      ) : (
        <EmptyState
          icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
          title="Nicio temă încă"
          description="Nu ai nicio temă de rezolvat deocamdată."
        />
      )}
    </div>
  );
}
