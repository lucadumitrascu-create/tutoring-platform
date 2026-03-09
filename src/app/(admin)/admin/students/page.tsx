'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User, AccessStatus, Group } from '@/types/database';
import { SkeletonTable } from '@/components/ui/Skeleton';

type FilterTab = 'all' | 'pending' | 'approved' | 'none';

const statusConfig: Record<AccessStatus, { label: string; bg: string; text: string }> = {
  none: { label: 'Fără acces', bg: 'bg-[#f0e8d8]', text: 'text-ink' },
  pending: { label: 'În așteptare', bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { label: 'Activ', bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { label: 'Respins', bg: 'bg-red-100', text: 'text-red-700' },
};

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadStudents();
    loadGroups();
  }, [page]);

  async function loadStudents() {
    try {
      const { data: users, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1) as { data: User[] | null; count: number | null };

      setStudents(users ?? []);
      setTotalCount(count ?? 0);
    } catch {
      setError('Nu s-au putut încărca elevii.');
    }
    setLoading(false);
  }

  async function loadGroups() {
    const { data } = await supabase.from('groups').select('*').order('name') as { data: Group[] | null };
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
        setError(data.error || `Acțiunea ${action} a eșuat.`);
      } else {
        await loadStudents();
      }
    } catch {
      setError(`Acțiunea ${action} a eșuat.`);
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
        const { data: existing } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .maybeSingle() as { data: { id: string } | null };

        if (!existing) {
          await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
        }
      }

      const group = groups.find((g) => g.id === groupId);
      setSuccessMsg(`${ids.length} ${ids.length > 1 ? 'elevi adăugați' : 'elev adăugat'} la ${group?.name || 'grup'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setSelectedStudents(new Set());
      setShowGroupPicker(false);
    } catch {
      setError('Nu s-au putut adăuga elevii la grup.');
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

  const tabs: { key: FilterTab; label: string; count: number; icon: React.ReactNode }[] = [
    {
      key: 'all', label: 'Toți', count: students.length,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      key: 'pending', label: 'În așteptare', count: pendingCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'approved', label: 'Activ', count: activeCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'none', label: 'Fără acces', count: noAccessCount,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="space-y-2 mb-6"><div className="animate-pulse bg-[#f0e8d8] rounded h-8 w-32" /><div className="animate-pulse bg-[#f0e8d8] rounded h-5 w-56" /></div>
        <div className="animate-pulse bg-[#f0e8d8] rounded-lg h-10 w-72 mb-6" />
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
      <h1 className="text-2xl font-bold font-hand text-ink mb-1">Elevi</h1>
      <p className="text-ink-lighter mb-6">Gestionează accesul elevilor la platformă.</p>

      {/* Filter icons */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            title={tab.label}
            className={`relative p-2.5 min-h-[44px] min-w-[44px] rounded-xl transition-all duration-150 active:scale-95 ${
              filter === tab.key
                ? 'bg-[#f0e8d8] text-sketch-dark'
                : 'bg-[#f0e8d8] text-ink-muted hover:bg-[#f0e8d8] hover:text-ink'
            }`}
          >
            {tab.icon}
            <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 ${
              filter === tab.key
                ? 'bg-sketch-dark text-white'
                : 'bg-sketch text-ink'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredStudents.length > 0 ? (
        <div className="bg-paper border border-sketch rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sketch-light">
                <th className="text-left font-medium text-ink-lighter px-5 py-3 w-10">
                  {approvedInView.length > 0 && (
                    <input type="checkbox" checked={allApprovedSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-sketch text-sketch-dark focus:ring-sketch-dark cursor-pointer" />
                  )}
                </th>
                <th className="text-left font-medium text-ink-lighter px-5 py-3">Elev</th>
                <th className="text-left font-medium text-ink-lighter px-5 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left font-medium text-ink-lighter px-5 py-3 hidden md:table-cell">Înscris</th>
                <th className="text-right font-medium text-ink-lighter px-5 py-3">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const status = statusConfig[student.access_status];
                const isLoading = actionLoading?.startsWith(student.id);
                const isApproved = student.access_status === 'approved';

                return (
                  <tr key={student.id} className="border-b border-sketch-light/50 last:border-0">
                    <td className="px-5 py-4">
                      {isApproved && (
                        <input type="checkbox" checked={selectedStudents.has(student.id)} onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 rounded border-sketch text-sketch-dark focus:ring-sketch-dark cursor-pointer" />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#f0e8d8] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-sketch-dark">
                            {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-ink">{student.full_name}</p>
                          <p className="text-xs text-ink-muted">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-muted hidden md:table-cell">
                      {new Date(student.created_at).toLocaleDateString('ro-RO', {
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
                              {actionLoading === `${student.id}-approve` ? 'Se aprobă...' : 'Aprobă'}
                            </button>
                            <button
                              onClick={() => handleAction(student.id, 'reject')}
                              disabled={isLoading}
                              className="text-xs bg-red-600 text-white font-medium px-3.5 py-2 min-h-[36px] rounded-md hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                              {actionLoading === `${student.id}-reject` ? 'Se respinge...' : 'Respinge'}
                            </button>
                          </>
                        )}
                        {student.access_status === 'approved' && (
                          <button
                            onClick={() => handleAction(student.id, 'revoke')}
                            disabled={isLoading}
                            className="text-xs text-red-500 font-medium hover:underline py-2 px-2 min-h-[36px] disabled:opacity-50"
                          >
                            {actionLoading === `${student.id}-revoke` ? 'Se revocă...' : 'Revocă'}
                          </button>
                        )}
                        {(student.access_status === 'none' || student.access_status === 'rejected') && (
                          <button
                            onClick={() => handleAction(student.id, 'grant')}
                            disabled={isLoading}
                            className="text-xs bg-sketch-dark text-white font-medium px-3.5 py-2 min-h-[36px] rounded-md hover:bg-ink active:scale-95 transition-all disabled:opacity-50"
                          >
                            {actionLoading === `${student.id}-grant` ? 'Se acordă...' : 'Acordă acces'}
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
        <div className="bg-paper border border-sketch border-dashed rounded-2xl p-8 sm:p-12 text-center">
          <svg className="w-12 h-12 text-sketch mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="text-ink-muted text-lg">
            {filter === 'all' ? 'Încă nu sunt elevi înregistrați.' : `Niciun elev ${tabs.find(t => t.key === filter)?.label.toLowerCase()}.`}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg bg-paper border border-sketch text-ink hover:bg-[#f0e8d8] transition-all ${page === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Anterior
          </button>
          <span className="text-sm text-ink">
            Pagina {page + 1} din {Math.ceil(totalCount / PAGE_SIZE)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= totalCount}
            className={`text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg bg-paper border border-sketch text-ink hover:bg-[#f0e8d8] transition-all ${(page + 1) * PAGE_SIZE >= totalCount ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Următor
          </button>
        </div>
      )}

      {/* Floating bar when students are selected */}
      {selectedStudents.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-ink text-white rounded-2xl shadow-2xl px-6 py-3.5 flex items-center gap-4">
            <span className="text-sm font-medium">{selectedStudents.size} {selectedStudents.size > 1 ? 'selectați' : 'selectat'}</span>
            <div className="w-px h-5 bg-ink-light" />
            <div className="relative">
              <button onClick={() => setShowGroupPicker(!showGroupPicker)}
                className="bg-sketch-dark text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-ink active:scale-95 transition-all">
                Adaugă la grup
              </button>
              {showGroupPicker && (
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-paper border border-sketch rounded-xl shadow-xl p-2 max-h-64 overflow-y-auto">
                  {groups.length > 0 ? groups.map((g) => (
                    <button key={g.id} onClick={() => addToGroup(g.id)} disabled={addingToGroup !== null}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-[#f0e8d8] transition-colors disabled:opacity-50 flex items-center justify-between">
                      <span>{g.name}</span>
                      {addingToGroup === g.id && (
                        <svg className="animate-spin w-4 h-4 text-sketch-dark" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      )}
                    </button>
                  )) : (
                    <p className="text-sm text-ink-muted px-3 py-2">Încă nu există grupuri.</p>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => { setSelectedStudents(new Set()); setShowGroupPicker(false); }}
              className="text-ink-muted hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
