'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { uploadToBunny } from '@/lib/bunny';
import type { Assignment, AssignmentSubmission, Group, User } from '@/types/database';
import { SkeletonList } from '@/components/ui/Skeleton';

interface AssignmentWithGroup extends Assignment {
  group: { name: string } | null;
  submission_count: number;
  pending_count: number;
}

interface SubmissionWithStudent extends AssignmentSubmission {
  student: User;
}

export default function AdminAssignmentsPage() {
  const supabase = createClient();

  const [assignments, setAssignments] = useState<AssignmentWithGroup[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionWithStudent[]>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [feedbackFiles, setFeedbackFiles] = useState<Record<string, File | null>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [assignmentsRes, groupsRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('assignments')
        .select('*, group:groups(name), assignment_submissions(id, status)')
        .order('created_at', { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('groups').select('*').order('name'),
    ]);

    const rawAssignments = (assignmentsRes.data ?? []) as (Assignment & {
      group: { name: string } | null;
      assignment_submissions: { id: string; status: string }[];
    })[];

    const mapped: AssignmentWithGroup[] = rawAssignments.map((a) => ({
      ...a,
      group: a.group,
      submission_count: a.assignment_submissions?.length ?? 0,
      pending_count: a.assignment_submissions?.filter((s) => s.status === 'submitted').length ?? 0,
    }));

    setAssignments(mapped);
    setGroups((groupsRes.data as Group[]) ?? []);
    setLoading(false);
  }

  async function loadSubmissions(assignmentId: string) {
    if (submissions[assignmentId]) return;
    setSubsLoading(assignmentId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('assignment_submissions')
      .select('*, student:users(*)')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false }) as { data: SubmissionWithStudent[] | null };
    setSubmissions((prev) => ({ ...prev, [assignmentId]: data ?? [] }));
    setSubsLoading(null);
  }

  function toggleExpand(assignmentId: string) {
    if (expandedAssignment === assignmentId) {
      setExpandedAssignment(null);
    } else {
      setExpandedAssignment(assignmentId);
      loadSubmissions(assignmentId);
    }
  }

  async function handleSubmissionAction(subId: string, assignmentId: string, action: 'approved' | 'rejected') {
    setActionLoading(subId);
    const feedback = feedbackMap[subId]?.trim() || null;

    let feedback_file_url: string | null = null;
    let feedback_file_name: string | null = null;
    const feedbackFile = feedbackFiles[subId];
    if (feedbackFile) {
      const result = await uploadToBunny(feedbackFile, 'feedback');
      if (result) {
        feedback_file_url = result.url;
        feedback_file_name = result.fileName;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('assignment_submissions').update({
      status: action, feedback, feedback_file_url, feedback_file_name,
    }).eq('id', subId);

    setFeedbackMap((prev) => { const copy = { ...prev }; delete copy[subId]; return copy; });
    setFeedbackFiles((prev) => { const copy = { ...prev }; delete copy[subId]; return copy; });

    // Reload submissions for this assignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('assignment_submissions')
      .select('*, student:users(*)')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false }) as { data: SubmissionWithStudent[] | null };
    setSubmissions((prev) => ({ ...prev, [assignmentId]: data ?? [] }));

    // Update assignment counts
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a;
        const subs = data ?? [];
        return {
          ...a,
          submission_count: subs.length,
          pending_count: subs.filter((s) => s.status === 'submitted').length,
        };
      })
    );

    setActionLoading(null);
  }

  const filtered = filterGroup
    ? assignments.filter((a) => a.group_id === filterGroup)
    : assignments;

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const groupColors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-teal-100 text-teal-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-indigo-100 text-indigo-700'];

  function getGroupColor(groupId: string) {
    const idx = groups.findIndex((g) => g.id === groupId);
    return groupColors[idx % groupColors.length] || groupColors[0];
  }

  if (loading) {
    return (
      <div>
        <div className="space-y-2 mb-6">
          <div className="animate-pulse bg-gray-200 rounded h-8 w-40" />
          <div className="animate-pulse bg-gray-200 rounded h-5 w-56" />
        </div>
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Assignments</h1>
          <p className="text-gray-500">All assignments across groups.</p>
        </div>
        <select
          value={filterGroup ?? ''}
          onChange={(e) => setFilterGroup(e.target.value || null)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-h-[44px]"
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Assignments list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((assignment) => (
            <div key={assignment.id}>
              {/* Assignment card */}
              <button
                onClick={() => toggleExpand(assignment.id)}
                className={`w-full text-left bg-white border rounded-2xl p-5 transition-all duration-200 hover:shadow-sm ${
                  expandedAssignment === assignment.id
                    ? 'border-primary-300 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{assignment.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getGroupColor(assignment.group_id)}`}>
                        {assignment.group?.name || 'Unknown'}
                      </span>
                    </div>
                    {assignment.deadline && (
                      <p className="text-xs text-gray-400 mt-1">
                        Deadline: {new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-gray-500">
                      {assignment.submission_count} submission{assignment.submission_count !== 1 ? 's' : ''}
                    </span>
                    {assignment.pending_count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        {assignment.pending_count} pending
                      </span>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedAssignment === assignment.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded submissions */}
              {expandedAssignment === assignment.id && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-primary-100 space-y-3">
                  {subsLoading === assignment.id ? (
                    <div className="py-6 flex justify-center">
                      <svg className="animate-spin w-5 h-5 text-primary-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : (submissions[assignment.id] ?? []).length > 0 ? (
                    (submissions[assignment.id] ?? []).map((sub) => (
                      <div key={sub.id} className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary-700">{sub.student?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{sub.student?.full_name}</p>
                              <p className="text-xs text-gray-400">{new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[sub.status] || ''}`}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </div>

                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline mb-3">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                          {sub.file_name}
                        </a>

                        {(sub.feedback || sub.feedback_file_url) && (
                          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Feedback</p>
                            {sub.feedback && <p className="text-sm text-gray-700">{sub.feedback}</p>}
                            {sub.feedback_file_url && (
                              <a href={sub.feedback_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                                {sub.feedback_file_name || 'Attached file'}
                              </a>
                            )}
                          </div>
                        )}

                        {sub.status === 'submitted' && (
                          <div className="space-y-3 pt-2 border-t border-gray-100">
                            <textarea
                              value={feedbackMap[sub.id] || ''}
                              onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                              rows={2}
                              placeholder="Optional feedback..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                            />
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
                              <input type="file" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setFeedbackFiles((prev) => ({ ...prev, [sub.id]: file }));
                              }} />
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                              {feedbackFiles[sub.id] ? feedbackFiles[sub.id]!.name : 'Attach file'}
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <button onClick={() => handleSubmissionAction(sub.id, assignment.id, 'approved')} disabled={actionLoading === sub.id}
                                className="bg-green-600 text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
                                {actionLoading === sub.id ? '...' : 'Approve'}
                              </button>
                              <button onClick={() => handleSubmissionAction(sub.id, assignment.id, 'rejected')} disabled={actionLoading === sub.id}
                                className="bg-red-500 text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50">
                                {actionLoading === sub.id ? '...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm py-4">No submissions yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-8 sm:p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <p className="text-gray-400 text-lg">
            {filterGroup ? 'No assignments in this group.' : 'No assignments yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
