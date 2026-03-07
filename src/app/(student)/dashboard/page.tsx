'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { User, Group, Meeting } from '@/types/database';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<(Meeting & { groupName: string })[]>([]);
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

        // Fetch groups
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: memberships } = await (supabase as any)
          .from('group_members')
          .select('group:groups(*)')
          .eq('user_id', authUser.id) as { data: { group: Group }[] | null };

        const userGroups = (memberships ?? []).map((m) => m.group);
        setGroups(userGroups);

        // Fetch upcoming meetings from all groups
        if (userGroups.length > 0) {
          const groupIds = userGroups.map((g) => g.id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: meetingsData } = await (supabase as any)
            .from('meetings')
            .select('*, group:groups(name)')
            .in('group_id', groupIds)
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(5) as { data: (Meeting & { group: { name: string } })[] | null };

          setUpcomingMeetings((meetingsData ?? []).map((m) => ({ ...m, groupName: m.group?.name || '' })));
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
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome back, {user?.full_name || 'Student'}!
      </h1>
      <p className="text-gray-500 mb-8">Here&apos;s your learning dashboard.</p>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h2>
          <div className="space-y-2">
            {upcomingMeetings.map((m) => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-primary-600 font-medium">{m.groupName}</span>
                    <span className="text-xs text-gray-400">{new Date(m.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <a href={m.meet_link} target="_blank" rel="noopener noreferrer"
                  className="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
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
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{group.description || 'No description'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 border-dashed rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-1">No groups yet.</p>
            <p className="text-gray-400 text-sm">Your teacher will add you to a group.</p>
          </div>
        )}
      </div>
    </div>
  );
}
