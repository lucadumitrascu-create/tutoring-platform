'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Assignment, AssignmentFile, AssignmentSubmission } from '@/types/database';
import { getRelativeTime, assignmentStatusConfig } from '@/lib/utils';
import { uploadToBunny } from '@/lib/bunny';
import { SkeletonLine } from '@/components/ui/Skeleton';

export default function StudentAssignmentPage() {
  const { id: groupId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const supabase = createClient();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: aData } = await (supabase as any).from('assignments').select('*').eq('id', assignmentId).single() as { data: Assignment | null };
      setAssignment(aData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fData } = await (supabase as any).from('assignment_files').select('*').eq('assignment_id', assignmentId).order('sort_order') as { data: AssignmentFile[] | null };
      setFiles(fData ?? []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: subData } = await (supabase as any).from('assignment_submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', user.id).single() as { data: AssignmentSubmission | null };
        setSubmission(subData);
      }

      setLoading(false);
    }
    load();
  }, [assignmentId]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not logged in.'); setUploading(false); return; }

      const result = await uploadToBunny(file, `homework/${user.id}/${assignmentId}`);
      if (!result) { setError('Upload failed.'); setUploading(false); return; }
      const { url: fileUrl, fileName } = result;

      if (submission) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('assignment_submissions').update({
          file_url: fileUrl, file_name: fileName, status: 'submitted', feedback: null,
        }).eq('id', submission.id);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('assignment_submissions').insert({
          assignment_id: assignmentId, student_id: user.id,
          file_url: fileUrl, file_name: fileName,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subData } = await (supabase as any).from('assignment_submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', user.id).single() as { data: AssignmentSubmission | null };
      setSubmission(subData);
    } catch {
      setError('Something went wrong.');
    }
    setUploading(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <SkeletonLine className="h-4 w-24 mb-6" />
        <SkeletonLine className="h-8 w-2/3 mb-2" />
        <SkeletonLine className="h-6 w-40 mb-6 rounded-full" />
        <SkeletonLine className="h-20 w-full mb-8" />
        <SkeletonLine className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!assignment) return <p className="text-gray-500 py-12 text-center">Assignment not found.</p>;

  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();
  const subStatus = submission ? submission.status : 'pending';
  const statusCfg = assignmentStatusConfig[subStatus as keyof typeof assignmentStatusConfig] || assignmentStatusConfig.pending;

  return (
    <div className="max-w-4xl">
      <Link href={`/groups/${groupId}`} className="text-sm text-primary-600 hover:underline mb-6 inline-flex items-center gap-1 py-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back to group
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {assignment.deadline && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
            Due: {new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {!isOverdue && assignment.deadline && new Date(assignment.deadline) > new Date() && (
              <span className="ml-1 opacity-75">({getRelativeTime(assignment.deadline)})</span>
            )}
          </span>
        )}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.label}
        </span>
      </div>

      {assignment.description && <p className="text-gray-600 mb-8 whitespace-pre-wrap">{assignment.description}</p>}

      {/* Requirement Files */}
      {files.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Requirements</h2>
          <div className="space-y-3">
            {files.map((f) => {
              if (f.file_type.startsWith('image/')) {
                return (
                  <div key={f.id}>
                    <img src={f.file_url} alt={f.file_name} className="rounded-2xl max-w-full border border-gray-200" />
                    <p className="text-xs text-gray-400 mt-1">{f.file_name}</p>
                  </div>
                );
              }
              if (f.file_type === 'application/pdf') {
                return (
                  <div key={f.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                    <iframe src={f.file_url} className="w-full h-[500px]" title={f.file_name} />
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <p className="text-sm text-gray-700">{f.file_name}</p>
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 font-medium hover:underline">Open</a>
                    </div>
                  </div>
                );
              }
              if (f.file_type.startsWith('video/')) {
                return (
                  <div key={f.id} className="rounded-2xl overflow-hidden bg-black">
                    <video controls className="w-full max-h-[500px]" preload="metadata">
                      <source src={f.file_url} type={f.file_type} />
                    </video>
                  </div>
                );
              }
              return (
                <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-gray-300 hover:shadow-sm active:scale-[0.99] transition-all min-h-[44px]">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  <span className="text-sm text-gray-700">{f.file_name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Submission Section */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Your Submission</h2>

        {submission ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-2 min-h-[44px]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                {submission.file_name}
              </a>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-400">Submitted {new Date(submission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

            {(submission.feedback || submission.feedback_file_url) && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Feedback</p>
                {submission.feedback && <p className="text-sm text-gray-700">{submission.feedback}</p>}
                {submission.feedback_file_url && (
                  <a href={submission.feedback_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                    {submission.feedback_file_name || 'Attached file'}
                  </a>
                )}
              </div>
            )}

            {(submission.status === 'rejected' || submission.status === 'submitted') && (
              <div className="mt-4">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors min-h-[44px]">
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Re-upload submission'}</span>
                </label>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors min-h-[44px]">
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Upload your solution'}</span>
            </label>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mt-3">{error}</div>}
      </div>
    </div>
  );
}
