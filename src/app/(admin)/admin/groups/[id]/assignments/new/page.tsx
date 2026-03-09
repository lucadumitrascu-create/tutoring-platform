'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Assignment } from '@/types/database';
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
}

export default function NewAssignmentPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    return uploadToBunny(f.file, 'assignments');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Titlul este obligatoriu.'); return; }
    setSaving(true);
    setError('');

    try {
      const { data: assignment, error: aErr } = await supabase
        .from('assignments')
        .insert({ group_id: groupId, title: title.trim(), description: description.trim(), deadline: deadline || null })
        .select().single() as { data: Assignment | null; error: { message: string } | null };

      if (aErr || !assignment) { setError(aErr?.message || 'Nu s-a putut crea tema.'); setSaving(false); return; }

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, uploading: true, progress: 50 } : pf));

        const result = await uploadFile(f);
        if (result) {
          await supabase.from('assignment_files').insert({
            assignment_id: assignment.id, file_url: result.url, file_type: f.fileType,
            file_name: result.fileName, sort_order: i,
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

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/groups/${groupId}`} className="text-sm text-sketch-dark hover:underline mb-6 inline-block">&larr; Înapoi la grup</Link>
      <h1 className="text-2xl font-bold font-hand text-ink mb-1">Temă nouă</h1>
      <p className="text-ink-lighter mb-8">Creează o temă pentru acest grup.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Titlu *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none"
            placeholder="ex. Exerciții Capitolul 3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Descriere</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none resize-none"
            placeholder="Descrie ce trebuie să facă elevii..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Termen limită</label>
          {deadline ? (
            <div className="flex items-center gap-2">
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none" />
              <button type="button" onClick={() => setDeadline('')}
                className="text-sm text-ink-muted hover:text-red-500 px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-[#f0e8d8] transition-colors flex-shrink-0"
                title="Elimină termenul limită">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16))}
              className="w-full border-2 border-dashed border-sketch rounded-lg px-4 py-3 text-sm text-ink-muted hover:border-sketch-dark hover:text-sketch-dark transition-colors text-left">
              Fără deadline — click pentru a adăuga
            </button>
          )}
        </div>

        {/* Files */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Fișiere cerință</label>
          <p className="text-xs text-ink-muted mb-3">Atașează PDF-uri, imagini sau videoclipuri cu cerințele temei.</p>

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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{f.fileName}</p>
                    {f.uploading && <div className="mt-1.5 h-1.5 bg-[#f0e8d8] rounded-full overflow-hidden"><div className="h-full bg-sketch-dark rounded-full transition-all" style={{ width: `${f.progress}%` }} /></div>}
                    {f.done && <p className="text-xs text-green-600 mt-0.5">Încărcat</p>}
                    {f.error && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                  </div>
                  {!f.uploading && !f.done && (
                    <button type="button" onClick={() => removeFile(f.id)} className="text-ink-muted hover:text-red-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
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

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-sketch-dark text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Se creează...' : 'Creează temă'}
          </button>
          <Link href={`/admin/groups/${groupId}`} className="text-sm text-ink-lighter hover:text-ink font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
