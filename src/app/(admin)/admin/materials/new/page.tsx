'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { MaterialCategory } from '@/types/database';

export default function NewCategoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Numele este obligatoriu.'); return; }
    setSaving(true);
    setError('');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cat, error: err } = await (supabase as any)
        .from('material_categories')
        .insert({ name: name.trim(), description: description.trim() })
        .select()
        .single() as { data: MaterialCategory | null; error: { message: string } | null };

      if (err || !cat) {
        setError(err?.message || 'Nu s-a putut crea categoria.');
        setSaving(false);
        return;
      }
      router.push(`/admin/materials/${cat.id}`);
    } catch {
      setError('Ceva nu a funcționat.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link href="/admin/materials" className="text-sm text-sketch-dark hover:underline mb-6 inline-block">&larr; Înapoi la materiale</Link>
      <h1 className="text-2xl font-bold font-hand text-ink mb-1">Categorie nouă</h1>
      <p className="text-ink-lighter mb-8">Creează o categorie pentru a organiza materialele.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nume categorie *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none"
            placeholder="ex. Business" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Descriere</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none resize-none"
            placeholder="Descriere opțională..." />
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-sketch-dark text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Se creează...' : 'Creează categorie'}
          </button>
          <Link href="/admin/materials" className="text-sm text-ink-lighter hover:text-ink font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
