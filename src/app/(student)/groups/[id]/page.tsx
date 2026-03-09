'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Group, Post, Assignment, Meeting, AssignmentSubmission } from '@/types/database';
import { getRelativeTime, assignmentStatusConfig } from '@/lib/utils';
import { SkeletonLine, SkeletonList } from '@/components/ui/Skeleton';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';

type Tab = 'posts' | 'assignments' | 'meetings';

export default function StudentGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [group, setGroup] = useState<Group | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [readPostIds, setReadPostIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroup() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('groups').select('*').eq('id', id).single() as { data: Group | null };
      setGroup(data);
      setLoading(false);
    }
    loadGroup();
  }, [id]);

  useEffect(() => {
    async function loadTabData() {
      if (tab === 'posts') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).from('posts').select('*').eq('group_id', id).order('created_at', { ascending: false }) as { data: Post[] | null };
        setPosts(data ?? []);

        // Load read status
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: reads } = await (supabase as any)
            .from('post_reads')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', data.map((p) => p.id)) as { data: { post_id: string }[] | null };
          setReadPostIds(new Set((reads ?? []).map((r) => r.post_id)));
        }
      } else if (tab === 'assignments') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).from('assignments').select('*').eq('group_id', id).order('created_at', { ascending: false }) as { data: Assignment[] | null };
        setAssignments(data ?? []);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: subs } = await (supabase as any).from('assignment_submissions').select('*').eq('student_id', user.id) as { data: AssignmentSubmission[] | null };
          setSubmissions(subs ?? []);
        }
      } else if (tab === 'meetings') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).from('meetings').select('*').eq('group_id', id).order('scheduled_at', { ascending: true }) as { data: Meeting[] | null };
        setMeetings(data ?? []);
      }
    }
    loadTabData();
  }, [tab, id]);

  if (loading) {
    return (
      <div>
        <SkeletonLine className="h-4 w-24 mb-4" />
        <SkeletonLine className="h-8 w-48 mb-2" />
        <SkeletonLine className="h-5 w-64 mb-6" />
        <SkeletonLine className="h-10 w-72 rounded-lg mb-6" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  if (!group) return <p className="text-ink-lighter py-12 text-center">Grupul nu a fost găsit.</p>;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'posts', label: 'Lecții', count: posts.length },
    { key: 'assignments', label: 'Teme', count: assignments.length },
    { key: 'meetings', label: 'Întâlniri', count: meetings.length },
  ];

  const filteredPosts = posts.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  function getAssignmentStatus(a: Assignment): 'pending' | 'submitted' | 'approved' | 'rejected' {
    const sub = submissions.find((s) => s.assignment_id === a.id);
    if (!sub) return 'pending';
    return sub.status;
  }

  return (
    <div>
      <Link href="/groups" className="text-sm text-sketch-dark hover:underline mb-4 inline-block">&larr; Înapoi la grupuri</Link>

      <h1 className="text-2xl font-bold text-ink mb-1 font-hand">{group.name}</h1>
      {group.description && <p className="text-ink-lighter mb-6">{group.description}</p>}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f0e8d8] rounded-lg p-1 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 transition-all active:scale-95 ${tab === t.key ? 'bg-paper text-ink shadow-sm' : 'text-ink-lighter hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* POSTS */}
      {tab === 'posts' && (
        <div>
          {posts.length > 0 && (
            <div className="mb-4">
              <SearchInput value={search} onChange={setSearch} placeholder="Caută lecții..." />
            </div>
          )}
          {filteredPosts.length > 0 ? (
            <div className="space-y-2">
              {filteredPosts.map((post) => {
                const isRead = readPostIds.has(post.id);
                return (
                  <Link key={post.id} href={`/groups/${id}/posts/${post.id}`}
                    className="flex items-start gap-3 bg-paper border border-sketch rounded-2xl px-5 py-4 hover:shadow-sm hover:border-sketch active:scale-[0.99] transition-all">
                    {/* Unread dot */}
                    <div className="flex-shrink-0 pt-1.5">
                      {!isRead ? (
                        <div className="w-2.5 h-2.5 bg-[#f0e8d8]0 rounded-full" />
                      ) : (
                        <div className="w-2.5 h-2.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-ink ${!isRead ? '' : 'text-ink-light'}`}>{post.title}</p>
                      {post.description && <p className="text-sm text-ink-lighter mt-1 line-clamp-2">{post.description}</p>}
                      <p className="text-xs text-ink-muted mt-2">{new Date(post.created_at).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : posts.length > 0 ? (
            <p className="text-ink-muted text-sm text-center py-8">Niciun rezultat pentru &ldquo;{search}&rdquo;</p>
          ) : (
            <EmptyState
              icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
              title="Nicio lecție încă"
              description="Profesorul tău nu a postat lecții încă."
            />
          )}
        </div>
      )}

      {/* ASSIGNMENTS */}
      {tab === 'assignments' && (
        <div>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((a) => {
                const status = getAssignmentStatus(a);
                const config = assignmentStatusConfig[status];
                const isOverdue = a.deadline && new Date(a.deadline) < new Date() && status === 'pending';
                return (
                  <Link key={a.id} href={`/groups/${id}/assignments/${a.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-paper border border-sketch rounded-2xl px-5 py-4 hover:shadow-sm hover:border-sketch active:scale-[0.99] transition-all">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-ink">{a.title}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                      {a.deadline && (
                        <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-ink-muted'}`}>
                          {isOverdue ? 'Întârziat' : `Termen: ${new Date(a.deadline).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                          {!isOverdue && a.deadline && new Date(a.deadline) > new Date() && (
                            <span className="ml-1.5 text-ink-muted">({getRelativeTime(a.deadline)})</span>
                          )}
                        </p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-sketch flex-shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
              title="Nicio temă încă"
              description="Nu au fost postate teme încă."
            />
          )}
        </div>
      )}

      {/* MEETINGS */}
      {tab === 'meetings' && (
        <div>
          {meetings.length > 0 ? (
            <div className="space-y-2">
              {meetings.map((m) => {
                const isPast = new Date(m.scheduled_at) < new Date();
                return (
                  <div key={m.id} className={`bg-paper border border-sketch rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${isPast ? 'opacity-60' : 'hover:shadow-sm hover:border-sketch'}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-ink">{m.title}</p>
                        {isPast && <span className="text-[10px] font-semibold bg-[#f0e8d8] text-ink-lighter px-2 py-0.5 rounded-full">Trecut</span>}
                        {!isPast && <span className="text-[10px] font-semibold bg-[#f0e8d8] text-sketch-dark px-2 py-0.5 rounded-full">{getRelativeTime(m.scheduled_at)}</span>}
                      </div>
                      <p className="text-xs text-ink-muted mt-1">{new Date(m.scheduled_at).toLocaleDateString('ro-RO', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!isPast && (
                      <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                        className="bg-sketch-dark text-paper text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all flex items-center justify-center">
                        Intră
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
              title="Nicio întâlnire programată"
              description="Nu au fost programate întâlniri încă."
            />
          )}
        </div>
      )}
    </div>
  );
}
