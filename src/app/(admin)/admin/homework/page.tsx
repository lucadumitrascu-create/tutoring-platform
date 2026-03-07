'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { Homework, User, Lesson } from '@/types/database';

type FilterStatus = 'all' | 'submitted' | 'approved' | 'rejected';

interface HomeworkWithDetails extends Homework {
  student: User;
  lesson: Lesson;
}

export default function AdminHomeworkPage() {
  const [homeworkList, setHomeworkList] = useState<HomeworkWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadHomework();
  }, []);

  async function loadHomework() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('homework')
        .select('*, student:users(*), lesson:lessons(*)')
        .order('created_at', { ascending: false }) as { data: HomeworkWithDetails[] | null };

      setHomeworkList(data ?? []);

      // Pre-fill feedback map
      if (data) {
        const map: Record<string, string> = {};
        for (const hw of data) {
          map[hw.id] = hw.feedback || '';
        }
        setFeedbackMap(map);
      }
    } catch {
      setError('Failed to load homework submissions.');
    }
    setLoading(false);
  }

  async function updateStatus(hw: HomeworkWithDetails, status: 'approved' | 'rejected') {
    setUpdatingId(hw.id);
    setError('');
    const feedback = feedbackMap[hw.id]?.trim() || null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('homework')
        .update({ status, feedback })
        .eq('id', hw.id);

      setHomeworkList((prev) =>
        prev.map((h) => (h.id === hw.id ? { ...h, status, feedback } : h))
      );
    } catch {
      setError('Failed to update homework status.');
    }
    setUpdatingId(null);
  }

  const filtered = filter === 'all'
    ? homeworkList
    : homeworkList.filter((h) => h.status === filter);

  const counts = {
    all: homeworkList.length,
    submitted: homeworkList.filter((h) => h.status === 'submitted').length,
    approved: homeworkList.filter((h) => h.status === 'approved').length,
    rejected: homeworkList.filter((h) => h.status === 'rejected').length,
  };

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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Homework Reviews</h1>
      <p className="text-gray-500 mb-6">Review, approve or reject student submissions.</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'submitted', 'approved', 'rejected'] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : s === 'submitted' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Homework list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((hw) => (
            <div key={hw.id} className="bg-white border border-gray-200 rounded-xl p-5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-700">
                      {hw.student?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{hw.student?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400 truncate">{hw.student?.email}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
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

              {/* Lesson + file info */}
              <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
                <div>
                  <span className="text-gray-400">Lesson:</span>{' '}
                  <span className="text-gray-700 font-medium">{hw.lesson?.title || 'Deleted'}</span>
                </div>
                <div>
                  <span className="text-gray-400">Submitted:</span>{' '}
                  <span className="text-gray-700">
                    {new Date(hw.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* File preview link */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 mb-4">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <a
                  href={hw.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 font-medium hover:underline truncate"
                >
                  {hw.file_name}
                </a>
              </div>

              {/* Feedback input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Feedback</label>
                <textarea
                  value={feedbackMap[hw.id] || ''}
                  onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [hw.id]: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  placeholder="Add feedback for the student..."
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStatus(hw, 'approved')}
                  disabled={updatingId === hw.id || hw.status === 'approved'}
                  className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updatingId === hw.id ? (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(hw, 'rejected')}
                  disabled={updatingId === hw.id || hw.status === 'rejected'}
                  className="bg-white border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <p className="text-gray-400 text-lg">
            {filter === 'all' ? 'No homework submitted yet.' : `No ${filter === 'submitted' ? 'pending' : filter} homework.`}
          </p>
        </div>
      )}
    </div>
  );
}
