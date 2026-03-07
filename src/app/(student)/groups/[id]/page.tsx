'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Group, Post, Assignment, Meeting } from '@/types/database';

type Tab = 'posts' | 'assignments' | 'meetings';

export default function StudentGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [group, setGroup] = useState<Group | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
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
      } else if (tab === 'assignments') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).from('assignments').select('*').eq('group_id', id).order('created_at', { ascending: false }) as { data: Assignment[] | null };
        setAssignments(data ?? []);
      } else if (tab === 'meetings') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).from('meetings').select('*').eq('group_id', id).order('scheduled_at', { ascending: true }) as { data: Meeting[] | null };
        setMeetings(data ?? []);
      }
    }
    loadTabData();
  }, [tab, id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  if (!group) return <p className="text-gray-500 py-12 text-center">Group not found.</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Lessons' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'meetings', label: 'Meetings' },
  ];

  return (
    <div>
      <Link href="/groups" className="text-sm text-primary-600 hover:underline mb-4 inline-block">&larr; Back to groups</Link>

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

      {/* POSTS */}
      {tab === 'posts' && (
        <div>
          {posts.length > 0 ? (
            <div className="space-y-2">
              {posts.map((post) => (
                <Link key={post.id} href={`/groups/${id}/posts/${post.id}`}
                  className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-primary-300 hover:shadow-sm transition-all">
                  <p className="font-medium text-gray-900">{post.title}</p>
                  {post.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </Link>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No lessons posted yet.</p>}
        </div>
      )}

      {/* ASSIGNMENTS */}
      {tab === 'assignments' && (
        <div>
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((a) => (
                <Link key={a.id} href={`/groups/${id}/assignments/${a.id}`}
                  className="block bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-primary-300 hover:shadow-sm transition-all">
                  <p className="font-medium text-gray-900">{a.title}</p>
                  {a.deadline && (
                    <p className={`text-xs mt-1 ${new Date(a.deadline) < new Date() ? 'text-red-400' : 'text-gray-400'}`}>
                      Due: {new Date(a.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No assignments yet.</p>}
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
                  <div key={m.id} className={`bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between ${isPast ? 'opacity-60' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{m.title}</p>
                        {isPast && <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Past</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(m.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!isPast && (
                      <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                        className="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Join
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : <p className="text-gray-400 text-sm">No meetings scheduled.</p>}
        </div>
      )}
    </div>
  );
}
