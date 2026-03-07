'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Group, Post, Assignment, Meeting, User } from '@/types/database';

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
    if (err) { setError(err.code === '23505' ? 'Already a member.' : 'Failed to add member.'); }
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
    if (!window.confirm('Delete this post?')) return;
    setActionLoading(`del-post-${postId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('posts').delete().eq('id', postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setActionLoading(null);
  }

  async function deleteAssignment(aId: string) {
    if (!window.confirm('Delete this assignment and all submissions?')) return;
    setActionLoading(`del-asgn-${aId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('assignments').delete().eq('id', aId);
    setAssignments((prev) => prev.filter((a) => a.id !== aId));
    setActionLoading(null);
  }

  async function deleteMeeting(mId: string) {
    if (!window.confirm('Delete this meeting?')) return;
    setActionLoading(`del-meet-${mId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('meetings').delete().eq('id', mId);
    setMeetings((prev) => prev.filter((m) => m.id !== mId));
    setActionLoading(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  if (!group) return <p className="text-gray-500 py-12 text-center">Group not found.</p>;

  const memberIds = new Set(members.map((m) => m.user_id));
  const availableStudents = allStudents.filter((s) => !memberIds.has(s.id));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'meetings', label: 'Meetings' },
    { key: 'members', label: `Members (${members.length})` },
  ];

  return (
    <div>
      <Link href="/admin/groups" className="text-sm text-primary-600 hover:underline mb-4 inline-block">&larr; Back to groups</Link>
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{group.name}</h1>
      {group.description && <p className="text-gray-500 mb-6">{group.description}</p>}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* POSTS TAB */}
      {tab === 'posts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lessons / Posts</h2>
            <Link href={`/admin/groups/${id}/posts/new`} className="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">New Post</Link>
          </div>
          {posts.length > 0 ? (
            <div className="space-y-2">
              {posts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/groups/${id}/posts/${post.id}/edit`} className="text-sm text-primary-600 font-medium hover:underline">Edit</Link>
                    <button onClick={() => deletePost(post.id)} disabled={actionLoading === `del-post-${post.id}`} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No posts yet.</p>}
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {tab === 'assignments' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
            <Link href={`/admin/groups/${id}/assignments/new`} className="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">New Assignment</Link>
          </div>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div key={a.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{a.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {a.deadline && <span className="text-xs text-gray-400">Due: {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      <span className="text-xs text-primary-600">{a.submissionCount} submission{a.submissionCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/groups/${id}/assignments/${a.id}`} className="text-sm text-primary-600 font-medium hover:underline">Manage</Link>
                    <button onClick={() => deleteAssignment(a.id)} disabled={actionLoading === `del-asgn-${a.id}`} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No assignments yet.</p>}
        </div>
      )}

      {/* MEETINGS TAB */}
      {tab === 'meetings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
            <Link href={`/admin/groups/${id}/meetings/new`} className="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">Schedule Meeting</Link>
          </div>
          {meetings.length > 0 ? (
            <div className="space-y-2">
              {meetings.map((m) => {
                const isPast = new Date(m.scheduled_at) < new Date();
                return (
                  <div key={m.id} className={`bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between ${isPast ? 'opacity-60' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{m.title}</p>
                        {isPast && <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Past</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(m.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 font-medium hover:underline">Join</a>
                      <button onClick={() => deleteMeeting(m.id)} disabled={actionLoading === `del-meet-${m.id}`} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-gray-400 text-sm">No meetings scheduled.</p>}
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>

          {/* Current members */}
          {members.length > 0 ? (
            <div className="space-y-1.5 mb-6">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-700">{m.user?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.user?.full_name}</p>
                      <p className="text-xs text-gray-400">{m.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => removeMember(m.id)} disabled={actionLoading === `rm-${m.id}`} className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50">Remove</button>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm mb-6">No members yet.</p>}

          {/* Add members */}
          {availableStudents.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Students</h3>
              <div className="space-y-1.5">
                {availableStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">{s.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{s.full_name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                    <button onClick={() => addMember(s.id)} disabled={actionLoading === `add-${s.id}`} className="text-xs bg-primary-600 text-white font-medium px-3 py-1.5 rounded-md hover:bg-primary-700 disabled:opacity-50">
                      {actionLoading === `add-${s.id}` ? 'Adding...' : 'Add'}
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
