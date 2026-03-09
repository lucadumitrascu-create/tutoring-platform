'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Group, Post, Assignment, Meeting, User } from '@/types/database';
import { SkeletonLine, SkeletonList } from '@/components/ui/Skeleton';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';

type Tab = 'posts' | 'assignments' | 'meetings' | 'members';

interface MemberWithUser {
  id: string;
  user_id: string;
  user: User;
}

export default function AdminGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [group, setGroup] = useState<Group | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [assignments, setAssignments] = useState<(Assignment & { submissionCount: number })[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { loadGroup(); }, [id]);
  useEffect(() => { loadTabData(); }, [tab, id]);

  async function loadGroup() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('groups').select('*').eq('id', id).single() as { data: Group | null };
    setGroup(data);
    setLoading(false);
  }

  async function loadTabData() {
    if (tab === 'posts') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('posts').select('*').eq('group_id', id).order('created_at', { ascending: false }) as { data: Post[] | null };
      setPosts(data ?? []);
    } else if (tab === 'assignments') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('assignments').select('*, assignment_submissions(count)').eq('group_id', id).order('created_at', { ascending: false }) as { data: (Assignment & { assignment_submissions: [{ count: number }] })[] | null };
      setAssignments((data ?? []).map((a) => ({ ...a, submissionCount: a.assignment_submissions?.[0]?.count ?? 0 })));
    } else if (tab === 'meetings') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('meetings').select('*').eq('group_id', id).order('scheduled_at', { ascending: true }) as { data: Meeting[] | null };
      setMeetings(data ?? []);
    } else if (tab === 'members') {
      await loadMembers();
    }
  }

  async function loadMembers() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membersData } = await (supabase as any).from('group_members').select('id, user_id, user:users(*)').eq('group_id', id) as { data: MemberWithUser[] | null };
    setMembers(membersData ?? []);

    const { data: students } = await supabase.from('users').select('*').eq('role', 'student').eq('access_status', 'approved').order('full_name') as { data: User[] | null };
    setAllStudents(students ?? []);
  }

  async function addMember(userId: string) {
    setActionLoading(`add-${userId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from('group_members').insert({ group_id: id, user_id: userId });
    if (err) { setError(err.code === '23505' ? 'Este deja membru.' : 'Nu s-a putut adăuga membrul.'); }
    else { await loadMembers(); }
    setActionLoading(null);
  }

  async function removeMember(membershipId: string) {
    setActionLoading(`rm-${membershipId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('group_members').delete().eq('id', membershipId);
    await loadMembers();
    setActionLoading(null);
  }

  async function deletePost(postId: string) {
    if (!window.confirm('Ștergi această postare?')) return;
    setActionLoading(`del-post-${postId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('posts').delete().eq('id', postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setActionLoading(null);
  }

  async function deleteAssignment(aId: string) {
    if (!window.confirm('Ștergi această temă și toate trimiterile?')) return;
    setActionLoading(`del-asgn-${aId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('assignments').delete().eq('id', aId);
    setAssignments((prev) => prev.filter((a) => a.id !== aId));
    setActionLoading(null);
  }

  async function deleteMeeting(mId: string) {
    if (!window.confirm('Ștergi această întâlnire?')) return;
    setActionLoading(`del-meet-${mId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('meetings').delete().eq('id', mId);
    setMeetings((prev) => prev.filter((m) => m.id !== mId));
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div>
        <SkeletonLine className="h-4 w-24 mb-4" />
        <SkeletonLine className="h-8 w-48 mb-2" />
        <SkeletonLine className="h-5 w-64 mb-6" />
        <SkeletonLine className="h-10 w-80 rounded-lg mb-6" />
        <SkeletonList rows={3} />
      </div>
    );
  }

  if (!group) return <p className="text-ink-lighter py-12 text-center">Grupul nu a fost găsit.</p>;

  const memberIds = new Set(members.map((m) => m.user_id));
  const availableStudents = allStudents.filter((s) => !memberIds.has(s.id));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Postări' },
    { key: 'assignments', label: 'Teme' },
    { key: 'meetings', label: 'Întâlniri' },
    { key: 'members', label: `Membri (${members.length})` },
  ];

  return (
    <div>
      <Link href="/admin/groups" className="text-sm text-sketch-dark hover:underline mb-4 inline-block">&larr; Înapoi la grupuri</Link>
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <h1 className="text-2xl font-bold font-hand text-ink mb-1">{group.name}</h1>
      {group.description && <p className="text-ink-lighter mb-6">{group.description}</p>}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f0e8d8] rounded-lg p-1 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 transition-all duration-150 active:scale-95 ${tab === t.key ? 'bg-paper text-ink shadow-sm' : 'text-ink-lighter hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* POSTS TAB */}
      {tab === 'posts' && (() => {
        const filteredPosts = posts.filter((p) =>
          !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
        );
        return (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold font-hand text-ink">Lecții / Postări</h2>
              <Link href={`/admin/groups/${id}/posts/new`} className="bg-sketch-dark text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 flex items-center justify-center">Postare nouă</Link>
            </div>
            {posts.length > 0 && (
              <div className="mb-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Caută postări..." />
              </div>
            )}
            {filteredPosts.length > 0 ? (
              <div className="space-y-2">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="bg-paper border border-sketch hover:border-sketch-dark rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-all duration-200">
                    <div>
                      <p className="font-medium text-ink">{post.title}</p>
                      <p className="text-xs text-ink-muted">{new Date(post.created_at).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/groups/${id}/posts/${post.id}/edit`} className="text-sm text-sketch-dark font-medium hover:underline py-1.5 px-2">Editează</Link>
                      <button onClick={() => deletePost(post.id)} disabled={actionLoading === `del-post-${post.id}`} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50 py-1.5 px-2">Șterge</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <p className="text-ink-muted text-sm text-center py-8">Niciun rezultat pentru &ldquo;{search}&rdquo;</p>
            ) : (
              <EmptyState
                icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
                title="Încă nu există postări"
                description="Creează prima postare pentru acest grup."
                action={<Link href={`/admin/groups/${id}/posts/new`} className="inline-block bg-sketch-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-ink active:scale-95 transition-all">Postare nouă</Link>}
              />
            )}
          </div>
        );
      })()}

      {/* ASSIGNMENTS TAB */}
      {tab === 'assignments' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-hand text-ink">Teme</h2>
            <Link href={`/admin/groups/${id}/assignments/new`} className="bg-sketch-dark text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 flex items-center">Temă nouă</Link>
          </div>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div key={a.id} className="bg-paper border border-sketch hover:border-sketch-dark rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-all duration-200">
                  <div>
                    <p className="font-medium text-ink">{a.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {a.deadline && <span className="text-xs text-ink-muted">Termen: {new Date(a.deadline).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}</span>}
                      <span className="text-xs text-sketch-dark">{a.submissionCount} {a.submissionCount !== 1 ? 'trimiteri' : 'trimitere'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/groups/${id}/assignments/${a.id}`} className="text-sm text-sketch-dark font-medium hover:underline py-1.5 px-2">Gestionează</Link>
                    <button onClick={() => deleteAssignment(a.id)} disabled={actionLoading === `del-asgn-${a.id}`} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50 py-1.5 px-2">Șterge</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
              title="Încă nu există teme"
              action={<Link href={`/admin/groups/${id}/assignments/new`} className="inline-block bg-sketch-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-ink active:scale-95 transition-all">Temă nouă</Link>}
            />
          )}
        </div>
      )}

      {/* MEETINGS TAB */}
      {tab === 'meetings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-hand text-ink">Întâlniri</h2>
            <Link href={`/admin/groups/${id}/meetings/new`} className="bg-sketch-dark text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 flex items-center">Programează întâlnire</Link>
          </div>
          {meetings.length > 0 ? (
            <div className="space-y-2">
              {meetings.map((m) => {
                const isPast = new Date(m.scheduled_at) < new Date();
                return (
                  <div key={m.id} className={`bg-paper border border-sketch hover:border-sketch-dark rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-all duration-200 ${isPast ? 'opacity-60' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-ink">{m.title}</p>
                        {isPast && <span className="text-[10px] font-semibold bg-[#f0e8d8] text-ink-lighter px-2 py-0.5 rounded-full">Trecut</span>}
                      </div>
                      <p className="text-xs text-ink-muted mt-1">{new Date(m.scheduled_at).toLocaleDateString('ro-RO', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="text-sm text-sketch-dark font-medium hover:underline py-1.5 px-2">Intră</a>
                      <button onClick={() => deleteMeeting(m.id)} disabled={actionLoading === `del-meet-${m.id}`} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50 py-1.5 px-2">Șterge</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
              title="Nicio întâlnire programată"
              action={<Link href={`/admin/groups/${id}/meetings/new`} className="inline-block bg-sketch-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-ink active:scale-95 transition-all">Programează întâlnire</Link>}
            />
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <div>
          <h2 className="text-lg font-semibold font-hand text-ink mb-4">Membri</h2>

          {/* Current members */}
          {members.length > 0 ? (
            <div className="space-y-1.5 mb-6">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-paper border border-sketch hover:border-sketch-dark rounded-xl px-4 py-3.5 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#f0e8d8] rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-sketch-dark">{m.user?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{m.user?.full_name}</p>
                      <p className="text-xs text-ink-muted">{m.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => removeMember(m.id)} disabled={actionLoading === `rm-${m.id}`} className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50 py-1.5 px-2 min-h-[36px]">Elimină</button>
                </div>
              ))}
            </div>
          ) : <p className="text-ink-muted text-sm mb-6">Încă nu există membri.</p>}

          {/* Add members */}
          {availableStudents.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-ink-lighter uppercase tracking-wide mb-2">Adaugă elevi</h3>
              <div className="space-y-1.5">
                {availableStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-[#f0e8d8] rounded-xl px-4 py-3.5 border border-sketch-light hover:border-sketch transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#f0e8d8] rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-ink-light">{s.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm text-ink">{s.full_name}</p>
                        <p className="text-xs text-ink-muted">{s.email}</p>
                      </div>
                    </div>
                    <button onClick={() => addMember(s.id)} disabled={actionLoading === `add-${s.id}`} className="text-xs bg-sketch-dark text-white font-medium px-3.5 py-2 min-h-[36px] rounded-md hover:bg-ink active:scale-95 transition-all disabled:opacity-50">
                      {actionLoading === `add-${s.id}` ? 'Se adaugă...' : 'Adaugă'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
