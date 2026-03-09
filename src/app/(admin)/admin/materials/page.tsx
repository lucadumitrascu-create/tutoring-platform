'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import type { MaterialCategory } from '@/types/database';
import { SkeletonCards } from '@/components/ui/Skeleton';

interface CategoryWithCount extends MaterialCategory {
  itemCount: number;
}

export default function MaterialsPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('material_categories')
        .select('*, material_items(count)')
        .order('created_at', { ascending: false }) as {
        data: (MaterialCategory & { material_items: [{ count: number }] })[] | null;
      };

      if (data) {
        setCategories(data.map((c) => ({
          ...c,
          itemCount: c.material_items?.[0]?.count ?? 0,
        })));
      }
    } catch {
      setError('Nu s-au putut încărca categoriile.');
    }
    setLoading(false);
  }

  async function handleDelete(cat: CategoryWithCount) {
    if (!window.confirm(`Ștergi "${cat.name}" și toate fișierele sale?`)) return;
    setDeleting(cat.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('material_categories').delete().eq('id', cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch {
      setError('Nu s-a putut șterge categoria.');
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2"><div className="animate-pulse bg-[#f0e8d8] rounded h-8 w-32" /><div className="animate-pulse bg-[#f0e8d8] rounded h-5 w-56" /></div>
          <div className="animate-pulse bg-[#f0e8d8] rounded-lg h-11 w-36" />
        </div>
        <SkeletonCards count={3} />
      </div>
    );
  }

  return (
    <div>
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-hand text-ink mb-1">Materiale</h1>
          <p className="text-ink-lighter">Organizează biblioteca de conținut pe categorii.</p>
        </div>
        <Link href="/admin/materials/new" className="bg-sketch-dark text-white text-sm font-medium px-5 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Categorie nouă
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-paper border border-sketch hover:border-sketch-dark rounded-2xl p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
              <div className="w-10 h-10 bg-[#f0e8d8] rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-sketch-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-1">{cat.name}</h3>
              <p className="text-sm text-ink-lighter line-clamp-2 mb-4 flex-1">{cat.description || 'Fără descriere'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">{cat.itemCount} {cat.itemCount !== 1 ? 'fișiere' : 'fișier'}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/materials/${cat.id}`} className="text-sm text-sketch-dark font-medium hover:underline">Gestionează</Link>
                  <button onClick={() => handleDelete(cat)} disabled={deleting === cat.id} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50">
                    {deleting === cat.id ? 'Se șterge...' : 'Șterge'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-paper border border-sketch border-dashed rounded-2xl p-8 sm:p-12 text-center">
          <svg className="w-12 h-12 text-sketch mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <p className="text-ink-muted text-lg mb-2">Încă nu există categorii</p>
          <Link href="/admin/materials/new" className="inline-block bg-sketch-dark text-white text-sm font-medium px-6 py-2.5 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150">
            Creează prima categorie
          </Link>
        </div>
      )}
    </div>
  );
}
