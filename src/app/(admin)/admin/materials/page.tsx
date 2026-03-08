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
      setError('Failed to load categories.');
    }
    setLoading(false);
  }

  async function handleDelete(cat: CategoryWithCount) {
    if (!window.confirm(`Delete "${cat.name}" and all its files?`)) return;
    setDeleting(cat.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('material_categories').delete().eq('id', cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch {
      setError('Failed to delete category.');
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="space-y-2"><div className="animate-pulse bg-gray-200 rounded h-8 w-32" /><div className="animate-pulse bg-gray-200 rounded h-5 w-56" /></div>
          <div className="animate-pulse bg-gray-200 rounded-lg h-11 w-36" />
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Materials</h1>
          <p className="text-gray-500">Organize your content library by category.</p>
        </div>
        <Link href="/admin/materials/new" className="bg-primary-600 text-white text-sm font-medium px-5 py-2.5 min-h-[44px] rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Category
        </Link>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{cat.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{cat.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{cat.itemCount} file{cat.itemCount !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/materials/${cat.id}`} className="text-sm text-primary-600 font-medium hover:underline">Manage</Link>
                  <button onClick={() => handleDelete(cat)} disabled={deleting === cat.id} className="text-sm text-red-500 font-medium hover:underline disabled:opacity-50">
                    {deleting === cat.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-8 sm:p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <p className="text-gray-400 text-lg mb-2">No categories yet</p>
          <Link href="/admin/materials/new" className="inline-block bg-primary-600 text-white text-sm font-medium px-6 py-2.5 min-h-[44px] rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-150">
            Create First Category
          </Link>
        </div>
      )}
    </div>
  );
}
