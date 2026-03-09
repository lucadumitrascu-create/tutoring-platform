'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { MaterialCategory, MaterialItem, Group, Post } from '@/types/database';
import { uploadToBunny } from '@/lib/bunny';
import { SkeletonLine, SkeletonList } from '@/components/ui/Skeleton';

interface PendingFile {
  id: string;
  file: File | null;
  fileName: string;
  displayName: string;
  fileType: string;
  source: 'bunny';
  uploading: boolean;
  progress: number;
  error: string;
  done: boolean;
  isExisting: boolean;
  dbId?: string;
  fileUrl?: string;
  editingName: boolean;
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
        id: crypto.randomUUID(), file: null, fileName: f.file_name, displayName: f.file_name, fileType: f.file_type,
        source: 'bunny' as const,
        uploading: false, progress: 100, error: '', done: true, isExisting: true, dbId: f.id, fileUrl: f.file_url, editingName: false,
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
      id: crypto.randomUUID(), file, fileName: file.name, displayName: file.name, fileType: file.type,
      source: 'bunny' as const,
      uploading: false, progress: 0, error: '', done: false, isExisting: false, editingName: false,
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

  function updateDisplayName(fileId: string, name: string) {
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, displayName: name } : f));
  }

  async function saveExistingName(f: PendingFile) {
    if (f.isExisting && f.dbId && f.displayName.trim() && f.displayName !== f.fileName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('material_items').update({ file_name: f.displayName.trim() }).eq('id', f.dbId);
      setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, fileName: f.displayName.trim(), editingName: false } : pf));
    } else {
      setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, displayName: f.fileName, editingName: false } : pf));
    }
  }

  async function uploadFile(f: PendingFile): Promise<{ url: string; fileName: string } | null> {
    if (!f.file) return null;
    return uploadToBunny(f.file, 'library');
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
          const saveName = f.displayName.trim() || result.fileName;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: inserted } = await (supabase as any).from('material_items').insert({
            category_id: categoryId, file_url: result.url, file_type: f.fileType, file_name: saveName, sort_order: i,
          }).select().single() as { data: MaterialItem | null };
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, progress: 100, done: true, isExisting: true, dbId: inserted?.id, fileUrl: result.url, fileName: saveName, displayName: saveName } : pf));
        } else {
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, error: 'Încărcare eșuată' } : pf));
        }
      }

      setSuccessMsg('Salvat!');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch {
      setError('Ceva nu a funcționat.');
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
        setError('Nu există fișiere de trimis. Încarcă fișiere mai întâi.');
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
        setError(postErr?.message || 'Nu s-a putut crea postarea.');
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
      setError('Ceva nu a funcționat.');
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
      <Link href="/admin/materials" className="text-sm text-sketch-dark hover:underline mb-6 inline-block">&larr; Înapoi la materiale</Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-hand text-ink mb-1">{category.name}</h1>
          {category.description && <p className="text-ink-lighter">{category.description}</p>}
        </div>
        {hasFiles && (
          <button onClick={() => setShowGroupPicker(!showGroupPicker)}
            className="bg-green-600 text-white text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-lg hover:bg-green-700 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            Trimite la grup
          </button>
        )}
      </div>

      {/* Group Picker */}
      {showGroupPicker && (
        <div className="bg-paper border border-sketch rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-ink mb-3">Alege un grup pentru a trimite acest conținut:</h3>
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((g) => (
                <button key={g.id} onClick={() => sendToGroup(g.id)} disabled={sendingTo !== null}
                  className="w-full text-left flex items-center justify-between bg-[#f0e8d8] rounded-xl px-4 py-3.5 min-h-[44px] hover:bg-[#f0e8d8] hover:border-sketch border border-sketch-light active:scale-[0.98] transition-all duration-150 disabled:opacity-50">
                  <div>
                    <p className="text-sm font-medium text-ink">{g.name}</p>
                    {g.description && <p className="text-xs text-ink-muted mt-0.5">{g.description}</p>}
                  </div>
                  {sendingTo === g.id ? (
                    <svg className="animate-spin w-4 h-4 text-sketch-dark" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted text-sm">Încă nu există grupuri. Creează mai întâi un grup.</p>
          )}
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{successMsg}</div>}

      {/* Files */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Fișiere</label>
          {files.length > 0 && (
            <div className="space-y-2 mb-4">
              {files.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-3 bg-[#f0e8d8] rounded-lg px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveFile(f.id, 'up')} disabled={idx === 0} className="text-ink-muted hover:text-ink disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg></button>
                    <button type="button" onClick={() => moveFile(f.id, 'down')} disabled={idx === files.length - 1} className="text-ink-muted hover:text-ink disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Editable name for new files (not yet uploaded) */}
                    {!f.isExisting && !f.done ? (
                      <input
                        type="text"
                        value={f.displayName}
                        onChange={(e) => updateDisplayName(f.id, e.target.value)}
                        className="w-full text-sm text-ink bg-paper border border-sketch rounded px-2 py-1 focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none"
                      />
                    ) : f.editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={f.displayName}
                          onChange={(e) => updateDisplayName(f.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveExistingName(f); if (e.key === 'Escape') setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, displayName: f.fileName, editingName: false } : pf)); }}
                          autoFocus
                          className="flex-1 text-sm text-ink bg-paper border border-sketch rounded px-2 py-1 focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none"
                        />
                        <button type="button" onClick={() => saveExistingName(f)} className="text-xs text-sketch-dark font-medium hover:underline">Salvează</button>
                        <button type="button" onClick={() => setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, displayName: f.fileName, editingName: false } : pf))} className="text-xs text-ink-muted hover:text-ink">Anulează</button>
                      </div>
                    ) : (
                      <p className="text-sm text-ink truncate cursor-pointer hover:text-sketch-dark" onClick={() => setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, editingName: true } : pf))}>
                        {f.displayName}
                      </p>
                    )}
                    {f.isExisting && !f.editingName && <p className="text-xs text-ink-muted mt-0.5">Salvat — click pe nume pentru a redenumi</p>}
                    {f.uploading && <div className="mt-1.5 h-1.5 bg-[#f0e8d8] rounded-full overflow-hidden"><div className="h-full bg-sketch-dark rounded-full" style={{ width: `${f.progress}%` }} /></div>}
                    {!f.isExisting && f.done && <p className="text-xs text-green-600 mt-0.5">Încărcat</p>}
                    {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                  </div>
                  <button type="button" onClick={() => removeFile(f)} className="text-ink-muted hover:text-red-500 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-sketch rounded-lg p-6 cursor-pointer hover:border-sketch-dark hover:bg-[#f0e8d8]/30 transition-colors">
            <input type="file" multiple className="hidden" accept="image/*,application/pdf,video/*" onChange={(e) => addFiles(e.target.files)} />
            <svg className="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <span className="text-sm text-ink-lighter">Click pentru a adăuga fișiere</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="bg-sketch-dark text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Se salvează...' : 'Salvează'}
          </button>
          <Link href="/admin/materials" className="text-sm text-ink-lighter hover:text-ink font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Înapoi</Link>
        </div>
      </div>
    </div>
  );
}
