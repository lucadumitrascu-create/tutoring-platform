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
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadStudents() {
      // Get all students
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false }) as { data: User[] | null };

      if (!users || users.length === 0) {
        setLoading(false);
        return;
      }

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

      // Map data per student
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
      setLoading(false);
    }
    loadStudents();
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Students</h1>
      <p className="text-gray-500 mb-8">View all registered students and their activity.</p>

      {students.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 px-5 py-3">Student</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Lessons</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden md:table-cell">Joined</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const isExpanded = expandedId === student.id;
                return (
                  <tr key={student.id} className="border-b border-gray-50 last:border-0">
                    <td colSpan={4} className="p-0">
                      {/* Main row */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : student.id)}
                        className="w-full text-left flex items-center hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary-700">
                              {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{student.email}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell text-gray-700">
                          {student.purchasedLessons.length}
                        </td>
                        <td className="px-5 py-4 text-gray-400 hidden md:table-cell">
                          {new Date(student.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </td>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-5 pb-5 bg-gray-50/50">
                          {/* Purchased lessons */}
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Purchased Lessons ({student.purchasedLessons.length})
                            </h4>
                            {student.purchasedLessons.length > 0 ? (
                              <div className="space-y-1.5">
                                {student.purchasedLessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"
                                  >
                                    <span className="text-sm text-gray-700">{lesson.title}</span>
                                    <span className="text-xs text-gray-400">
                                      {lesson.is_free ? 'Free' : `$${lesson.price.toFixed(2)}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No lessons purchased.</p>
                            )}
                          </div>

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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
