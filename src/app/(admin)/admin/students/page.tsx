'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User, Lesson, Homework } from '@/types/database';

interface StudentWithDetails extends User {
  purchasedLessons: Lesson[];
  homeworkList: Homework[];
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [grantingAccess, setGrantingAccess] = useState<string | null>(null);
  const [revokingAccess, setRevokingAccess] = useState<string | null>(null);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false }) as { data: User[] | null };

      if (!users || users.length === 0) {
        setLoading(false);
        return;
      }

      // Get all lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .order('title') as { data: Lesson[] | null };

      setAllLessons(lessons ?? []);

      // Get all purchases with lessons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: purchases } = await (supabase as any)
        .from('purchases')
        .select('user_id, lesson:lessons(*)') as {
        data: { user_id: string; lesson: Lesson }[] | null;
      };

      // Get all homework
      const { data: homework } = await supabase
        .from('homework')
        .select('*') as { data: Homework[] | null };

      const enriched: StudentWithDetails[] = users.map((u) => ({
        ...u,
        purchasedLessons: purchases
          ? purchases.filter((p) => p.user_id === u.id).map((p) => p.lesson)
          : [],
        homeworkList: homework
          ? homework.filter((h) => h.student_id === u.id)
          : [],
      }));

      setStudents(enriched);
    } catch {
      setError('Failed to load students.');
    }
    setLoading(false);
  }

  async function grantAccess(studentId: string, lessonId: string) {
    setGrantingAccess(`${studentId}-${lessonId}`);
    setError('');
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, lessonId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to grant access.');
      } else {
        await loadStudents();
      }
    } catch {
      setError('Failed to grant access.');
    }
    setGrantingAccess(null);
  }

  async function revokeAccess(studentId: string, lessonId: string) {
    setRevokingAccess(`${studentId}-${lessonId}`);
    setError('');
    try {
      const res = await fetch('/api/access', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, lessonId }),
      });
      if (!res.ok) {
        setError('Failed to revoke access.');
      } else {
        await loadStudents();
      }
    } catch {
      setError('Failed to revoke access.');
    }
    setRevokingAccess(null);
  }

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
    <div>
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Students</h1>
      <p className="text-gray-500 mb-8">Manage student access to lessons.</p>

      {students.length > 0 ? (
        <div className="space-y-3">
          {students.map((student) => {
            const isExpanded = expandedId === student.id;
            const purchasedIds = new Set(student.purchasedLessons.map((l) => l.id));
            const unpurchasedLessons = allLessons.filter((l) => !purchasedIds.has(l.id) && !l.is_free);

            return (
              <div key={student.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : student.id)}
                  className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary-700">
                        {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 hidden sm:block">
                      {student.purchasedLessons.length} lesson{student.purchasedLessons.length !== 1 ? 's' : ''}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    {/* Current access */}
                    <div className="mt-4 mb-5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Active Access ({student.purchasedLessons.length})
                      </h4>
                      {student.purchasedLessons.length > 0 ? (
                        <div className="space-y-1.5">
                          {student.purchasedLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2 border border-green-100"
                            >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                <span className="text-sm text-gray-700">{lesson.title}</span>
                              </div>
                              <button
                                onClick={() => revokeAccess(student.id, lesson.id)}
                                disabled={revokingAccess === `${student.id}-${lesson.id}`}
                                className="text-xs text-red-500 font-medium hover:underline disabled:opacity-50"
                              >
                                {revokingAccess === `${student.id}-${lesson.id}` ? 'Revoking...' : 'Revoke'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No access granted yet.</p>
                      )}
                    </div>

                    {/* Grant access */}
                    {unpurchasedLessons.length > 0 && (
                      <div className="mb-5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Grant Access
                        </h4>
                        <div className="space-y-1.5">
                          {unpurchasedLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm text-gray-700 truncate">{lesson.title}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">${lesson.price.toFixed(2)}</span>
                              </div>
                              <button
                                onClick={() => grantAccess(student.id, lesson.id)}
                                disabled={grantingAccess === `${student.id}-${lesson.id}`}
                                className="text-xs bg-primary-600 text-white font-medium px-3 py-1 rounded-md hover:bg-primary-700 disabled:opacity-50 flex-shrink-0"
                              >
                                {grantingAccess === `${student.id}-${lesson.id}` ? 'Granting...' : 'Grant'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Homework */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Homework ({student.homeworkList.length})
                      </h4>
                      {student.homeworkList.length > 0 ? (
                        <div className="space-y-1.5">
                          {student.homeworkList.map((hw) => (
                            <div
                              key={hw.id}
                              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"
                            >
                              <a
                                href={hw.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline truncate"
                              >
                                {hw.file_name}
                              </a>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  hw.status === 'approved'
                                    ? 'bg-green-100 text-green-700'
                                    : hw.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {hw.status === 'submitted' ? 'Pending' : hw.status.charAt(0).toUpperCase() + hw.status.slice(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No homework submitted.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="text-gray-400 text-lg">No students registered yet.</p>
        </div>
      )}
    </div>
  );
}
