'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Lesson } from '@/types/database';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all lessons
        const { data: allLessons } = await supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false }) as { data: Lesson[] | null };

        setLessons(allLessons ?? []);

        // Fetch user's purchases
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: purchases } = await supabase
            .from('purchases')
            .select('lesson_id')
            .eq('user_id', user.id) as { data: { lesson_id: string }[] | null };

          if (purchases) {
            setPurchasedIds(new Set(purchases.map((p) => p.lesson_id)));
          }
        }
      } catch {
        setError('Failed to load lessons.');
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Available Lessons</h1>
      <p className="text-gray-500 mb-8">Browse and access all lessons.</p>

      {lessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => {
            const isPurchased = purchasedIds.has(lesson.id);
            const isFree = lesson.is_free;
            const hasAccess = isPurchased || isFree;

            return (
              <div
                key={lesson.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col"
              >
                {/* Card content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Price badge */}
                  <div className="mb-3">
                    {isFree ? (
                      <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        Free
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-semibold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-full">
                        ${lesson.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                    {lesson.description}
                  </p>

                  {lesson.scheduled_at && (
                    <p className="text-xs text-gray-400 mb-4">
                      <span className="font-medium text-primary-600">Live Session:</span>{' '}
                      {new Date(lesson.scheduled_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}

                  {/* Action button */}
                  {hasAccess ? (
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="w-full text-center bg-primary-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Access Lesson
                    </Link>
                  ) : (
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="w-full text-center bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      View Lesson
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-gray-400 text-lg">No lessons available yet.</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </div>
  );
}
