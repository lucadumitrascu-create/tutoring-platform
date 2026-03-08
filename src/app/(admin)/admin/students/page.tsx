'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User, AccessStatus, Group } from '@/types/database';
import { SkeletonTable } from '@/components/ui/Skeleton';

type FilterTab = 'all' | 'pending' | 'approved' | 'none';

const statusConfig: Record<AccessStatus, { label: string; bg: string; text: string }> = {
  none: { label: 'No Access', bg: 'bg-gray-100', text: 'text-gray-700' },
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { label: 'Active', bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' },
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Group[]>([]);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadStudents();
    loadGroups();
  }, []);

  async function loadStudents() {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false }) as { data: User[] | null };

      setStudents(users ?? []);
    } catch {
      setError('Failed to load students.');
    }
    setLoading(false);
  }

  async function loadGroups() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('groups').select('*').order('name') as { data: Group[] | null };
    setGroups(data ?? []);
  }

  async function handleAction(studentId: string, action: 'approve' | 'reject' | 'revoke' | 'grant') {
    setActionLoading(`${studentId}-${action}`);
    setError('');

    try {
      let res: Response;

      if (action === 'approve' || action === 'reject') {
        res = await fetch('/api/access', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: studentId, action }),
        });
      } else if (action === 'revoke') {
        res = await fetch('/api/access', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: studentId }),
        });
      } else {
        // grant = directly approve
        res = await fetch('/api/access', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: studentId, action: 'approve' }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `Failed to ${action}.`);
      } else {
        await loadStudents();
      }
    } catch {
      setError(`Failed to ${action}.`);
    }
    setActionLoading(null);
  }

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const approvedInView = filteredStudents.filter((s) => s.access_status === 'approved');
    const allSelected = approvedInView.every((s) => selectedStudents.has(s.id));
    if (allSelected) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(approvedInView.map((s) => s.id)));
    }
  }

  async function addToGroup(groupId: string) {
    setAddingToGroup(groupId);
    setError('');

    try {
      const ids = Array.from(selectedStudents);
      for (const userId of ids) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase as any)
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .maybeSingle() as { data: { id: string } | null };

        if (!existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('group_members').insert({ group_id: groupId, user_id: userId });
        }
      }

      const group = groups.find((g) => g.id === groupId);
      setSuccessMsg(`${ids.length} student${ids.length > 1 ? 's' : ''} added to ${group?.name || 'group'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setSelectedStudents(new Set());
      setShowGroupPicker(false);
    } catch {
      setError('Failed to add students to group.');
    }
    setAddingToGroup(null);
  }

  const filteredStudents = students.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'none') return s.access_status === 'none' || s.access_status === 'rejected';
    return s.access_status === filter;
  });

  const pendingCount = students.filter((s) => s.access_status === 'pending').length;
  const activeCount = students.filter((s) => s.access_status === 'approved').length;
  const noAccessCount = students.filter((s) => s.access_status === 'none' || s.access_status === 'rejected').length;
  const approvedInView = filteredStudents.filter((s) => s.access_status === 'approved');
  const allApprovedSelected = approvedInView.length > 0 && approvedInView.every((s) => selectedStudents.has(s.id));

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: students.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Active', count: activeCount },
    { key: 'none', label: 'No Access', count: noAccessCount },
  ];

  if (loading) {
    return (
      <div>
        <div className="space-y-2 mb-6"><div className="animate-pulse bg-gray-200 rounded h-8 w-32" /><div className="animate-pulse bg-gray-200 rounded h-5 w-56" /></div>
        <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-72 mb-6" />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{successMsg}</div>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Students</h1>
      <p className="text-gray-500 mb-6">Manage student access to the platform.</p>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 transition-all duration-150 active:scale-95 ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${filter === tab.key ? 'text-gray-500' : 'text-gray-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredStudents.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 px-5 py-3 w-10">
                  {approvedInView.length > 0 && (
                    <input type="checkbox" checked={allApprovedSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                  )}
                </th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Student</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden md:table-cell">Joined</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const status = statusConfig[student.access_status];
                const isLoading = actionLoading?.startsWith(student.id);
                const isApproved = student.access_status === 'approved';

                return (
                  <tr key={student.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-4">
                      {isApproved && (
                        <input type="checkbox" checked={selectedStudents.has(student.id)} onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary-700">
                            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.full_name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 hidden md:table-cell">
                      {new Date(student.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {student.access_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(student.id, 'approve')}
                              disabled={isLoading}
                              className="text-xs bg-green-600 text-white font-medium px-3.5 py-2 min-h-[36px] rounded-md hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {actionLoading === `${student.id}-approve` ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleAction(student.id, 'reject')}
                              disabled={isLoading}
                              className="text-xs bg-red-600 text-white font-medium px-3.5 py-2 min-h-[36px] rounded-md hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {actionLoading === `${student.id}-reject` ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {student.access_status === 'approved' && (
                          <button
                            onClick={() => handleAction(student.id, 'revoke')}
                            disabled={isLoading}
                            className="text-xs text-red-500 font-medium hover:underline py-2 px-2 min-h-[36px] disabled:opacity-50"
                          >
                            {actionLoading === `${student.id}-revoke` ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                        {(student.access_status === 'none' || student.access_status === 'rejected') && (
                          <button
                            onClick={() => handleAction(student.id, 'grant')}
                            disabled={isLoading}
                            className="text-xs bg-primary-600 text-white font-medium px-3.5 py-2 min-h-[36px] rounded-md hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {actionLoading === `${student.id}-grant` ? 'Granting...' : 'Grant Access'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-8 sm:p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="text-gray-400 text-lg">
            {filter === 'all' ? 'No students registered yet.' : `No ${tabs.find(t => t.key === filter)?.label.toLowerCase()} students.`}
          </p>
        </div>
      )}

      {/* Floating bar when students are selected */}
      {selectedStudents.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-3.5 flex items-center gap-4">
            <span className="text-sm font-medium">{selectedStudents.size} selected</span>
            <div className="w-px h-5 bg-gray-700" />
            <div className="relative">
              <button onClick={() => setShowGroupPicker(!showGroupPicker)}
                className="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-700 active:scale-95 transition-all">
                Add to Group
              </button>
              {showGroupPicker && (
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-2 max-h-64 overflow-y-auto">
                  {groups.length > 0 ? groups.map((g) => (
                    <button key={g.id} onClick={() => addToGroup(g.id)} disabled={addingToGroup !== null}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-between">
                      <span>{g.name}</span>
                      {addingToGroup === g.id && (
                        <svg className="animate-spin w-4 h-4 text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      )}
                    </button>
                  )) : (
                    <p className="text-sm text-gray-400 px-3 py-2">No groups yet.</p>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => { setSelectedStudents(new Set()); setShowGroupPicker(false); }}
              className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
