'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Lesson } from '@/types/database';

interface LessonWithCount extends Lesson {
  enrolledCount: number;
}

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<LessonWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadLessons();
  }, []);

  async function loadLessons() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('lessons')
        .select('*, purchases(count)')
        .order('created_at', { ascending: false }) as {
        data: (Lesson & { purchases: [{ count: number }] })[] | null;
      };

      if (data) {
        setLessons(
          data.map((l) => ({
            ...l,
            enrolledCount: l.purchases?.[0]?.count ?? 0,
          }))
        );
      }
    } catch {
      setError('Failed to load lessons.');
    }
    setLoading(false);
  }

  async function handleDelete(lesson: LessonWithCount) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(lesson.id);
    setError('');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('materials').delete().eq('lesson_id', lesson.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('homework').delete().eq('lesson_id', lesson.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('purchases').delete().eq('lesson_id', lesson.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('lessons').delete().eq('id', lesson.id);

      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch {
      setError('Failed to delete lesson. Please try again.');
    }
    setDeleting(null);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Lessons</h1>
          <p className="text-gray-500">Manage your lessons and materials.</p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="bg-primary-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Lesson
        </Link>
      </div>

      {lessons.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 px-5 py-3">Title</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Price</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Enrolled</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden md:table-cell">Scheduled</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{lesson.description}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    {lesson.is_free ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Free</span>
                    ) : (
                      <span className="text-gray-700">${lesson.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-gray-700">{lesson.enrolledCount}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden md:table-cell">
                    {lesson.scheduled_at
                      ? new Date(lesson.scheduled_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/lessons/${lesson.id}/edit`}
                        className="text-sm text-primary-600 font-medium hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(lesson)}
                        disabled={deleting === lesson.id}
                        className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50"
                      >
                        {deleting === lesson.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-gray-400 text-lg mb-2">No lessons yet</p>
          <p className="text-gray-400 text-sm mb-6">Create your first lesson to get started.</p>
          <Link
            href="/admin/lessons/new"
            className="inline-block bg-primary-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create First Lesson
          </Link>
        </div>
      )}
    </div>
  );
}
