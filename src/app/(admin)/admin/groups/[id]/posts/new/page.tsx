'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Post, MaterialCategory, MaterialItem } from '@/types/database';
import { uploadToBunny } from '@/lib/bunny';

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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<Record<string, MaterialItem[]>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from('material_categories')
        .select('*, material_items(count)')
        .order('name') as { data: (MaterialCategory & { material_items: [{ count: number }] })[] | null };
      setCategories((data ?? []).map((c) => ({ ...c, itemCount: c.material_items?.[0]?.count ?? 0 })));
    }
    loadCategories();
  }, []);

  async function toggleCategory(catId: string) {
    if (expandedCategory === catId) {
      setExpandedCategory(null);
      setSelectedItems(new Set());
      return;
    }

    setExpandedCategory(catId);

    if (!categoryItems[catId]) {
      setLoadingCategory(catId);
      const { data: items } = await supabase.from('material_items').select('*').eq('category_id', catId).order('sort_order') as { data: MaterialItem[] | null };
      const fetched = items ?? [];
      setCategoryItems((prev) => ({ ...prev, [catId]: fetched }));
      setSelectedItems(new Set(fetched.map((i) => i.id)));
      setLoadingCategory(null);
    } else {
      setSelectedItems(new Set(categoryItems[catId].map((i) => i.id)));
    }
  }

  function toggleItem(itemId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }

  function addSelectedItems() {
    if (!expandedCategory || !categoryItems[expandedCategory]) return;
    const items = categoryItems[expandedCategory].filter((i) => selectedItems.has(i.id));
    if (items.length === 0) return;

    const libraryFiles: PendingFile[] = items.map((item) => ({
      id: crypto.randomUUID(), file: null, fileName: item.file_name, fileType: item.file_type,
      source: 'library' as const, uploading: false, progress: 100, error: '', done: true,
      libraryUrl: item.file_url,
    }));
    setFiles((prev) => [...prev, ...libraryFiles]);

    const cat = categories.find((c) => c.id === expandedCategory);
    if (!title.trim() && cat) setTitle(cat.name);

    setExpandedCategory(null);
    setSelectedItems(new Set());
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
    return uploadToBunny(f.file, 'posts');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Titlul este obligatoriu.'); return; }
    setSaving(true);
    setError('');

    try {
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({ group_id: groupId, title: title.trim(), description: description.trim() })
        .select().single() as { data: Post | null; error: { message: string } | null };

      if (postErr || !post) { setError(postErr?.message || 'Nu s-a putut crea postarea.'); setSaving(false); return; }

      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        if (f.source === 'library' && f.libraryUrl) {
          // Library files already have URLs, just create post_file record
          await supabase.from('post_files').insert({
            post_id: post.id, file_url: f.libraryUrl, file_type: f.fileType,
            file_name: f.fileName, sort_order: i,
          });
        } else {
          // Upload new files
          setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: true, progress: 50 } : pf));
          const result = await uploadFile(f);
          if (result) {
            await supabase.from('post_files').insert({
              post_id: post.id, file_url: result.url, file_type: f.fileType,
              file_name: result.fileName, sort_order: i,
            });
            setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, progress: 100, done: true } : pf));
          } else {
            setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: false, error: 'Încărcare eșuată' } : pf));
          }
        }
      }

      router.push(`/admin/groups/${groupId}`);
    } catch {
      setError('Ceva nu a funcționat.');
      setSaving(false);
    }
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith('video/')) return <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>;
    if (fileType === 'application/pdf') return <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    if (fileType.startsWith('image/')) return <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>;
    return <svg className="w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
  }

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/groups/${groupId}`} className="text-sm text-sketch-dark hover:underline mb-6 inline-block">&larr; Înapoi la grup</Link>
      <h1 className="text-2xl font-bold font-hand text-ink mb-1">Postare nouă</h1>
      <p className="text-ink-lighter mb-8">Creează o lecție sau postare de conținut pentru acest grup.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Titlu *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none"
            placeholder="ex. Introducere în algebră" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Descriere</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none resize-none"
            placeholder="Descrie conținutul lecției..." />
        </div>

        {/* Files */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Fișiere</label>
          <p className="text-xs text-ink-muted mb-3">Încarcă fișiere sau alege din biblioteca de materiale.</p>

          {files.length > 0 && (
            <div className="space-y-2 mb-4">
              {files.map((f, idx) => (
                <div key={f.id} className="flex items-center gap-3 bg-[#f0e8d8] rounded-lg px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button type="button" onClick={() => moveFile(f.id, 'up')} disabled={idx === 0}
                      className="text-ink-muted hover:text-ink disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg></button>
                    <button type="button" onClick={() => moveFile(f.id, 'down')} disabled={idx === files.length - 1}
                      className="text-ink-muted hover:text-ink disabled:opacity-30"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-paper border border-sketch flex items-center justify-center flex-shrink-0">
                    {getFileIcon(f.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{f.fileName}</p>
                    {f.source === 'library' && <p className="text-xs text-sketch-dark mt-0.5">Din bibliotecă</p>}
                    {f.uploading && <div className="mt-1.5 h-1.5 bg-[#f0e8d8] rounded-full overflow-hidden"><div className="h-full bg-sketch-dark rounded-full transition-all" style={{ width: `${f.progress}%` }} /></div>}
                    {f.source !== 'library' && f.done && <p className="text-xs text-green-600 mt-0.5">Încărcat</p>}
                    {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                  </div>
                  <span className="text-[10px] font-medium text-ink-muted uppercase flex-shrink-0">
                    {f.source === 'library' ? 'LIB' : f.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                  {!f.uploading && (f.source === 'library' || !f.done) && (
                    <button type="button" onClick={() => removeFile(f.id)} className="text-ink-muted hover:text-red-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-sketch rounded-lg p-6 min-h-[44px] cursor-pointer hover:border-sketch-dark hover:bg-[#f0e8d8]/30 active:scale-[0.98] transition-all duration-150">
              <input type="file" multiple className="hidden" accept="image/*,application/pdf,video/*" onChange={(e) => addFiles(e.target.files)} />
              <svg className="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <span className="text-sm text-ink-lighter">Încarcă fișiere</span>
            </label>
            {categories.length > 0 && (
              <button type="button" onClick={() => setShowLibrary(!showLibrary)}
                className={`flex-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 min-h-[44px] active:scale-[0.98] transition-all duration-150 ${showLibrary ? 'border-sketch-dark bg-[#f0e8d8]/50' : 'border-sketch hover:border-sketch-dark hover:bg-[#f0e8d8]/30'}`}>
                <svg className="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                <span className="text-sm text-ink-lighter">Din bibliotecă</span>
              </button>
            )}
          </div>

          {/* Library picker */}
          {showLibrary && (
            <div className="mt-3 bg-paper border border-sketch rounded-2xl p-4">
              <p className="text-xs font-semibold text-ink-lighter uppercase tracking-wide mb-2">Alege o categorie</p>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <button type="button" onClick={() => toggleCategory(cat.id)} disabled={loadingCategory !== null}
                      className={`w-full text-left flex items-center justify-between rounded-xl px-4 py-3.5 min-h-[44px] border active:scale-[0.98] transition-all duration-150 disabled:opacity-50 ${expandedCategory === cat.id ? 'bg-[#f0e8d8] border-sketch' : 'bg-[#f0e8d8] border-sketch-light hover:bg-[#f0e8d8] hover:border-sketch'}`}>
                      <div>
                        <p className="text-sm font-medium text-ink">{cat.name}</p>
                        <p className="text-xs text-ink-muted">{cat.itemCount} {cat.itemCount !== 1 ? 'fișiere' : 'fișier'}</p>
                      </div>
                      {loadingCategory === cat.id ? (
                        <svg className="animate-spin w-4 h-4 text-sketch-dark" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg className={`w-4 h-4 text-ink-muted transition-transform ${expandedCategory === cat.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      )}
                    </button>

                    {/* Expanded file list */}
                    {expandedCategory === cat.id && categoryItems[cat.id] && (
                      <div className="mt-1 ml-2 border-l-2 border-sketch-light pl-3 py-2 space-y-1">
                        {categoryItems[cat.id].map((item) => (
                          <label key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f0e8d8] cursor-pointer transition-colors">
                            <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItem(item.id)}
                              className="w-4 h-4 rounded border-sketch text-sketch-dark focus:ring-sketch-dark" />
                            <div className="flex-shrink-0">{getFileIcon(item.file_type)}</div>
                            <span className="text-sm text-ink truncate">{item.file_name}</span>
                          </label>
                        ))}
                        <button type="button" onClick={addSelectedItems} disabled={selectedItems.size === 0}
                          className="mt-2 w-full bg-sketch-dark text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-ink active:scale-95 transition-all disabled:opacity-50">
                          Adaugă selecția ({selectedItems.size})
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-sketch-dark text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Se creează...' : 'Creează postare'}
          </button>
          <Link href={`/admin/groups/${groupId}`} className="text-sm text-ink-lighter hover:text-ink font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
