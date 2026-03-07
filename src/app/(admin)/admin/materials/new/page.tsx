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
    if (!name.trim()) { setError('Name is required.'); return; }
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
        setError(err?.message || 'Failed to create category.');
        setSaving(false);
        return;
      }
      router.push(`/admin/materials/${cat.id}`);
    } catch {
      setError('Something went wrong.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link href="/admin/materials" className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Back to materials</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New Category</h1>
      <p className="text-gray-500 mb-8">Create a category to organize your materials.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="e.g. Business" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            placeholder="Optional description..." />
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-primary-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Creating...' : 'Create Category'}
          </button>
          <Link href="/admin/materials" className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2.5">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
