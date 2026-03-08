'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Post, PostFile } from '@/types/database';

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

export default function EditPostPage() {
  const { id: groupId, postId } = useParams<{ id: string; postId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: post } = await (supabase as any).from('posts').select('*').eq('id', postId).single() as { data: Post | null };
      if (!post) { router.push(`/admin/groups/${groupId}`); return; }
      setTitle(post.title);
      setDescription(post.description);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingFiles } = await (supabase as any).from('post_files').select('*').eq('post_id', postId).order('sort_order') as { data: PostFile[] | null };
      setFiles((existingFiles ?? []).map((f) => ({
        id: crypto.randomUUID(), file: null, fileName: f.file_name, fileType: f.file_type,
        source: 'bunny' as const,
        uploading: false, progress: 100, error: '', done: true, isExisting: true, dbId: f.id,
      })));
      setLoading(false);
    }
    load();
  }, [postId]);

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
      await (supabase as any).from('post_files').delete().eq('id', f.dbId);
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
    const params = new URLSearchParams({ folder: 'posts', name: f.file.name });
    const res = await fetch(`/api/bunny/upload?${params}`, { method: 'POST', body: f.file });
    if (!res.ok) return null;
    const data = await res.json();
    return { url: data.url, fileName: data.fileName };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('posts').update({ title: title.trim(), description: description.trim() }).eq('id', postId);

      // Update sort_order for existing files
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.isExisting && f.dbId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('post_files').update({ sort_order: i }).eq('id', f.dbId);
        }
      }

      // Upload new files
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.isExisting) continue;
        setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: true, progress: 50 } : pf));

        const result = await uploadFile(f);
        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('post_files').insert({
            post_id: postId, file_url: result.url, file_type: f.fileType, file_name: result.fileName, sort_order: i,
          });
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, progress: 100, done: true } : pf));
        } else {
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, error: 'Upload failed' } : pf));
        }
      }

      router.push(`/admin/groups/${groupId}`);
    } catch {
      setError('Something went wrong.');
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/groups/${groupId}`} className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Back to group</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Files</label>
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
                    {f.isExisting && <p className="text-xs text-gray-400 mt-0.5">Existing</p>}
                    {f.uploading && <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${f.progress}%` }} /></div>}
                    {!f.isExisting && f.done && <p className="text-xs text-green-600 mt-0.5">Uploaded</p>}
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
            <span className="text-sm text-gray-500">Click to add files</span>
          </label>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-primary-600 text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/admin/groups/${groupId}`} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
