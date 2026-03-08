'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { MaterialCategory, MaterialItem, Group, Post } from '@/types/database';
import { SkeletonLine, SkeletonList } from '@/components/ui/Skeleton';

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
  fileUrl?: string;
}

export default function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [category, setCategory] = useState<MaterialCategory | null>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cat } = await (supabase as any).from('material_categories').select('*').eq('id', categoryId).single() as { data: MaterialCategory | null };
      if (!cat) { router.push('/admin/materials'); return; }
      setCategory(cat);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: items } = await (supabase as any).from('material_items').select('*').eq('category_id', categoryId).order('sort_order') as { data: MaterialItem[] | null };
      setFiles((items ?? []).map((f) => ({
        id: crypto.randomUUID(), file: null, fileName: f.file_name, fileType: f.file_type,
        source: 'bunny' as const,
        uploading: false, progress: 100, error: '', done: true, isExisting: true, dbId: f.id, fileUrl: f.file_url,
      })));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: groupsData } = await (supabase as any).from('groups').select('*').order('name') as { data: Group[] | null };
      setGroups(groupsData ?? []);

      setLoading(false);
    }
    load();
  }, [categoryId]);

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
      await (supabase as any).from('material_items').delete().eq('id', f.dbId);
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
    const params = new URLSearchParams({ folder: 'library', name: f.file.name });
    const res = await fetch(`/api/bunny/upload?${params}`, { method: 'POST', body: f.file });
    if (!res.ok) return null;
    const data = await res.json();
    return { url: data.url, fileName: data.fileName };
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      // Update sort_order for existing files
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.isExisting && f.dbId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('material_items').update({ sort_order: i }).eq('id', f.dbId);
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
          const { data: inserted } = await (supabase as any).from('material_items').insert({
            category_id: categoryId, file_url: result.url, file_type: f.fileType, file_name: result.fileName, sort_order: i,
          }).select().single() as { data: MaterialItem | null };
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, progress: 100, done: true, isExisting: true, dbId: inserted?.id, fileUrl: result.url } : pf));
        } else {
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, error: 'Upload failed' } : pf));
        }
      }

      setSuccessMsg('Saved!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch {
      setError('Something went wrong.');
    }
    setSaving(false);
  }

  async function sendToGroup(groupId: string) {
    if (!category) return;
    setSendingTo(groupId);
    setError('');

    try {
      // Get all existing material items with URLs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: items } = await (supabase as any).from('material_items').select('*').eq('category_id', categoryId).order('sort_order') as { data: MaterialItem[] | null };

      if (!items || items.length === 0) {
        setError('No files to send. Upload files first.');
        setSendingTo(null);
        return;
      }

      // Create post in group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: post, error: postErr } = await (supabase as any)
        .from('posts')
        .insert({ group_id: groupId, title: category.name, description: category.description })
        .select().single() as { data: Post | null; error: { message: string } | null };

      if (postErr || !post) {
        setError(postErr?.message || 'Failed to create post.');
        setSendingTo(null);
        return;
      }

      // Copy all files as post_files
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('post_files').insert({
          post_id: post.id, file_url: item.file_url, file_type: item.file_type, file_name: item.file_name, sort_order: i,
        });
      }

      setShowGroupPicker(false);
      router.push(`/admin/groups/${groupId}`);
    } catch {
      setError('Something went wrong.');
      setSendingTo(null);
    }
  }

  if (loading) return (
    <div>
      <SkeletonLine className="h-4 w-28 mb-4" />
      <SkeletonLine className="h-8 w-48 mb-2" />
      <SkeletonLine className="h-5 w-64 mb-8" />
      <SkeletonList rows={3} />
    </div>
  );

  if (!category) return null;

  const hasFiles = files.some((f) => f.isExisting || f.done);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/materials" className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Back to materials</Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{category.name}</h1>
          {category.description && <p className="text-gray-500">{category.description}</p>}
        </div>
        {hasFiles && (
          <button onClick={() => setShowGroupPicker(!showGroupPicker)}
            className="bg-green-600 text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Send to Group
          </button>
        )}
      </div>

      {/* Group Picker */}
      {showGroupPicker && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose a group to send this content to:</h3>
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((g) => (
                <button key={g.id} onClick={() => sendToGroup(g.id)} disabled={sendingTo !== null}
                  className="w-full text-left flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5 min-h-[44px] hover:bg-primary-50 hover:border-primary-200 border border-gray-100 active:scale-[0.98] transition-all duration-150 disabled:opacity-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{g.name}</p>
                    {g.description && <p className="text-xs text-gray-400 mt-0.5">{g.description}</p>}
                  </div>
                  {sendingTo === g.id ? (
                    <svg className="animate-spin w-4 h-4 text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No groups created yet. Create a group first.</p>
          )}
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{successMsg}</div>}

      {/* Files */}
      <div className="space-y-6">
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
                    {f.isExisting && <p className="text-xs text-gray-400 mt-0.5">Saved</p>}
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="bg-primary-600 text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Saving...' : 'Save'}
          </button>
          <Link href="/admin/materials" className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Back</Link>
        </div>
      </div>
    </div>
  );
}
