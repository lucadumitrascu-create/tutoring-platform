'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Assignment, AssignmentFile, AssignmentSubmission, User } from '@/types/database';
import { SkeletonLine, SkeletonList } from '@/components/ui/Skeleton';
import { uploadToBunny } from '@/lib/bunny';

interface PendingFile {
  id: string;
  file: File | null;
  fileName: string;
  fileType: string;
  source: 'bunny';
  uploading: boolean;
  progress: number;
  error: string;
  done: boolean;
  isExisting: boolean;
  dbId?: string;
}

interface SubmissionWithStudent extends AssignmentSubmission {
  student: User;
}

type ViewTab = 'details' | 'submissions';

export default function ManageAssignmentPage() {
  const { id: groupId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<ViewTab>('details');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [feedbackFiles, setFeedbackFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: assignment } = await (supabase as any).from('assignments').select('*').eq('id', assignmentId).single() as { data: Assignment | null };
      if (!assignment) { router.push(`/admin/groups/${groupId}`); return; }
      setTitle(assignment.title);
      setDescription(assignment.description);
      setDeadline(assignment.deadline ? assignment.deadline.slice(0, 16) : '');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingFiles } = await (supabase as any).from('assignment_files').select('*').eq('assignment_id', assignmentId).order('sort_order') as { data: AssignmentFile[] | null };
      setFiles((existingFiles ?? []).map((f) => ({
        id: crypto.randomUUID(), file: null, fileName: f.file_name, fileType: f.file_type,
        source: 'bunny' as const,
        uploading: false, progress: 100, error: '', done: true, isExisting: true, dbId: f.id,
      })));

      await loadSubmissions();
      setLoading(false);
    }
    load();
  }, [assignmentId]);

  async function loadSubmissions() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('assignment_submissions').select('*, student:users(*)').eq('assignment_id', assignmentId).order('created_at', { ascending: false }) as { data: SubmissionWithStudent[] | null };
    setSubmissions(data ?? []);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: PendingFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(), file, fileName: file.name, fileType: file.type,
      source: 'bunny' as const,
      uploading: false, progress: 0, error: '', done: false, isExisting: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  async function removeFile(f: PendingFile) {
    if (f.isExisting && f.dbId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('assignment_files').delete().eq('id', f.dbId);
    }
    setFiles((prev) => prev.filter((pf) => pf.id !== f.id));
  }

  function moveFile(fileId: string, direction: 'up' | 'down') {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === fileId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  async function uploadFile(f: PendingFile): Promise<{ url: string; fileName: string } | null> {
    if (!f.file) return null;
    return uploadToBunny(f.file, 'assignments');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Titlul este obligatoriu.'); return; }
    setSaving(true);
    setError('');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('assignments').update({
        title: title.trim(), description: description.trim(), deadline: deadline || null,
      }).eq('id', assignmentId);

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.isExisting && f.dbId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('assignment_files').update({ sort_order: i }).eq('id', f.dbId);
        }
      }

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.isExisting) continue;
        setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: true, progress: 50 } : pf));

        const result = await uploadFile(f);
        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('assignment_files').insert({
            assignment_id: assignmentId, file_url: result.url, file_type: f.fileType, file_name: result.fileName, sort_order: i,
          });
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, progress: 100, done: true } : pf));
        } else {
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, error: 'Încărcare eșuată' } : pf));
        }
      }

      router.push(`/admin/groups/${groupId}`);
    } catch {
      setError('Ceva nu a funcționat.');
      setSaving(false);
    }
  }

  async function handleSubmissionAction(subId: string, action: 'approved' | 'rejected') {
    setActionLoading(subId);
    setError('');
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
    const { error: updateError } = await (supabase as any).from('assignment_submissions').update({
      status: action, feedback, feedback_file_url, feedback_file_name,
    }).eq('id', subId);

    if (updateError) {
      console.error('Update failed:', updateError);
      setError(`Acțiunea ${action} a eșuat: ${updateError.message}`);
      setActionLoading(null);
      return;
    }

    setFeedbackFiles((prev) => { const copy = { ...prev }; delete copy[subId]; return copy; });
    await loadSubmissions();
    setActionLoading(null);
  }

  if (loading) return (
    <div>
      <SkeletonLine className="h-4 w-24 mb-4" />
      <SkeletonLine className="h-8 w-56 mb-2" />
      <SkeletonLine className="h-5 w-40 mb-6 rounded-full" />
      <SkeletonLine className="h-10 w-72 rounded-lg mb-6" />
      <SkeletonList rows={3} />
    </div>
  );

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/groups/${groupId}`} className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Înapoi la grup</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestionează tema</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto scrollbar-hide">
        {([{ key: 'details', label: 'Detalii' }, { key: 'submissions', label: `Trimiteri (${submissions.length})` }] as { key: ViewTab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 transition-all duration-150 active:scale-95 ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* DETAILS TAB */}
      {tab === 'details' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titlu *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descriere</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Termen limită</label>
            {deadline ? (
              <div className="flex items-center gap-2">
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                <button type="button" onClick={() => setDeadline('')}
                  className="text-sm text-gray-400 hover:text-red-500 px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  title="Elimină termenul limită">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16))}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-colors text-left">
                Fără deadline — click pentru a adăuga
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fișiere cerință</label>
            {files.length > 0 && (
              <div className="space-y-2 mb-4">
                {files.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveFile(f.id, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg></button>
                      <button type="button" onClick={() => moveFile(f.id, 'down')} disabled={idx === files.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{f.fileName}</p>
                      {f.isExisting && <p className="text-xs text-gray-400 mt-0.5">Existent</p>}
                      {f.uploading && <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${f.progress}%` }} /></div>}
                      {!f.isExisting && f.done && <p className="text-xs text-green-600 mt-0.5">Încărcat</p>}
                      {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                    </div>
                    <button type="button" onClick={() => removeFile(f)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
              <input type="file" multiple className="hidden" accept="image/*,application/pdf,video/*" onChange={(e) => addFiles(e.target.files)} />
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span className="text-sm text-gray-500">Click pentru a adăuga fișiere</span>
            </label>
          </div>

          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-primary-600 text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
            <Link href={`/admin/groups/${groupId}`} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Anulează</Link>
          </div>
        </form>
      )}

      {/* SUBMISSIONS TAB */}
      {tab === 'submissions' && (
        <div>
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          {submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-700">{sub.student?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sub.student?.full_name}</p>
                        <p className="text-xs text-gray-400">{new Date(sub.created_at).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[sub.status] || ''}`}>
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </span>
                  </div>

                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline mb-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      {sub.file_name}
                    </a>
                  )}

                  {(sub as any).text_answer && (
                    <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Răspuns text</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{(sub as any).text_answer}</p>
                    </div>
                  )}

                  {(sub.feedback || sub.feedback_file_url) && (
                    <div className="bg-gray-50 rounded-lg px-4 py-3 mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Feedback</p>
                      {sub.feedback && <p className="text-sm text-gray-700">{sub.feedback}</p>}
                      {sub.feedback_file_url && (
                        <a href={sub.feedback_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline mt-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                          {sub.feedback_file_name || 'Fișier atașat'}
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
                        placeholder="Feedback opțional..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                      />
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        <input type="file" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFeedbackFiles((prev) => ({ ...prev, [sub.id]: file }));
                        }} />
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                        {feedbackFiles[sub.id] ? feedbackFiles[sub.id]!.name : 'Atașează fișier'}
                      </label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button onClick={() => handleSubmissionAction(sub.id, 'approved')} disabled={actionLoading === sub.id}
                          className="bg-green-600 text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
                          {actionLoading === sub.id ? '...' : 'Aprobă'}
                        </button>
                        <button onClick={() => handleSubmissionAction(sub.id, 'rejected')} disabled={actionLoading === sub.id}
                          className="bg-red-500 text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50">
                          {actionLoading === sub.id ? '...' : 'Respinge'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Încă nu există trimiteri.</p>
          )}
        </div>
      )}
    </div>
  );
}
