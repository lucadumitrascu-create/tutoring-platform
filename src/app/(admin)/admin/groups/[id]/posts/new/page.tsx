'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Post, MaterialCategory, MaterialItem } from '@/types/database';

interface PendingFile {
  id: string;
  file: File | null;
  fileName: string;
  fileType: string;
  source: 'bunny' | 'library';
  uploading: boolean;
  progress: number;
  error: string;
  done: boolean;
  libraryUrl?: string;
}

interface CategoryWithItems extends MaterialCategory {
  itemCount: number;
}

export default function NewPostPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Materials library
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('material_categories')
        .select('*, material_items(count)')
        .order('name') as { data: (MaterialCategory & { material_items: [{ count: number }] })[] | null };
      setCategories((data ?? []).map((c) => ({ ...c, itemCount: c.material_items?.[0]?.count ?? 0 })));
    }
    loadCategories();
  }, []);

  async function addFromCategory(catId: string, catName: string) {
    setLoadingCategory(catId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items } = await (supabase as any).from('material_items').select('*').eq('category_id', catId).order('sort_order') as { data: MaterialItem[] | null };

    if (items && items.length > 0) {
      const libraryFiles: PendingFile[] = items.map((item) => ({
        id: crypto.randomUUID(), file: null, fileName: item.file_name, fileType: item.file_type,
        source: 'library' as const, uploading: false, progress: 100, error: '', done: true,
        libraryUrl: item.file_url,
      }));
      setFiles((prev) => [...prev, ...libraryFiles]);
      if (!title.trim()) setTitle(catName);
    }
    setLoadingCategory(null);
    setShowLibrary(false);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: PendingFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(), file, fileName: file.name, fileType: file.type,
      source: 'bunny' as const,
      uploading: false, progress: 0, error: '', done: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function removeFile(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
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
      const { data: post, error: postErr } = await (supabase as any)
        .from('posts')
        .insert({ group_id: groupId, title: title.trim(), description: description.trim() })
        .select().single() as { data: Post | null; error: { message: string } | null };

      if (postErr || !post) { setError(postErr?.message || 'Failed to create post.'); setSaving(false); return; }

      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        if (f.source === 'library' && f.libraryUrl) {
          // Library files already have URLs, just create post_file record
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('post_files').insert({
            post_id: post.id, file_url: f.libraryUrl, file_type: f.fileType,
            file_name: f.fileName, sort_order: i,
          });
        } else {
          // Upload new files
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: true, progress: 50 } : pf));
          const result = await uploadFile(f);
          if (result) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from('post_files').insert({
              post_id: post.id, file_url: result.url, file_type: f.fileType,
              file_name: result.fileName, sort_order: i,
            });
            setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, progress: 100, done: true } : pf));
          } else {
            setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, error: 'Upload failed' } : pf));
          }
        }
      }

      router.push(`/admin/groups/${groupId}`);
    } catch {
      setError('Something went wrong.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/groups/${groupId}`} className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Back to group</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New Post</h1>
      <p className="text-gray-500 mb-8">Create a lesson or content post for this group.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="e.g. Introducere în algebră" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            placeholder="Describe the lesson content..." />
        </div>

        {/* Files */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Files</label>
          <p className="text-xs text-gray-400 mb-3">Upload files or pick from your materials library.</p>

          {files.length > 0 && (
            <div className="space-y-2 mb-4">
              {files.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveFile(f.id, 'up')} disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg></button>
                    <button type="button" onClick={() => moveFile(f.id, 'down')} disabled={idx === files.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {f.fileType.startsWith('video/') ? <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                      : f.fileType === 'application/pdf' ? <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      : <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{f.fileName}</p>
                    {f.source === 'library' && <p className="text-xs text-primary-500 mt-0.5">From library</p>}
                    {f.uploading && <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${f.progress}%` }} /></div>}
                    {f.source !== 'library' && f.done && <p className="text-xs text-green-600 mt-0.5">Uploaded</p>}
                    {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 uppercase flex-shrink-0">
                    {f.source === 'library' ? 'LIB' : f.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                  {!f.uploading && (f.source === 'library' || !f.done) && (
                    <button type="button" onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 min-h-[44px] cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 active:scale-[0.98] transition-all duration-150">
              <input type="file" multiple className="hidden" accept="image/*,application/pdf,video/*" onChange={(e) => addFiles(e.target.files)} />
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span className="text-sm text-gray-500">Upload files</span>
            </label>
            {categories.length > 0 && (
              <button type="button" onClick={() => setShowLibrary(!showLibrary)}
                className={`flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 min-h-[44px] active:scale-[0.98] transition-all duration-150 ${showLibrary ? 'border-primary-400 bg-primary-50/50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/30'}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                <span className="text-sm text-gray-500">From library</span>
              </button>
            )}
          </div>

          {/* Library picker */}
          {showLibrary && (
            <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Choose a category</p>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => addFromCategory(cat.id, cat.name)} disabled={loadingCategory !== null}
                    className="w-full text-left flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5 min-h-[44px] hover:bg-primary-50 border border-gray-100 hover:border-primary-200 active:scale-[0.98] transition-all duration-150 disabled:opacity-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400">{cat.itemCount} file{cat.itemCount !== 1 ? 's' : ''}</p>
                    </div>
                    {loadingCategory === cat.id ? (
                      <svg className="animate-spin w-4 h-4 text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-primary-600 text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Creating...' : 'Create Post'}
          </button>
          <Link href={`/admin/groups/${groupId}`} className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
