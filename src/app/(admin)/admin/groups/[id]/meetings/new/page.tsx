'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewMeetingPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Titlul este obligatoriu.'); return; }
    if (!meetLink.trim()) { setError('Link-ul Meet este obligatoriu.'); return; }
    if (!scheduledAt) { setError('Data și ora sunt obligatorii.'); return; }
    setSaving(true);
    setError('');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase as any)
        .from('meetings')
        .insert({ group_id: groupId, title: title.trim(), meet_link: meetLink.trim(), scheduled_at: scheduledAt });

      if (err) { setError(err.message || 'Nu s-a putut programa întâlnirea.'); setSaving(false); return; }
      router.push(`/admin/groups/${groupId}`);
    } catch {
      setError('Ceva nu a funcționat.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Link href={`/admin/groups/${groupId}`} className="text-sm text-sketch-dark hover:underline mb-6 inline-block">&larr; Înapoi la grup</Link>
      <h1 className="text-2xl font-bold font-hand text-ink mb-1">Programează întâlnire</h1>
      <p className="text-ink-lighter mb-8">Configurează o sesiune Google Meet pentru acest grup.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Titlu *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none"
            placeholder="ex. Pregătire test Capitolul 5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Link Google Meet *</label>
          <input type="url" value={meetLink} onChange={(e) => setMeetLink(e.target.value)}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none"
            placeholder="https://meet.google.com/abc-defg-hij" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Data și ora *</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-sketch rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-sketch-dark focus:border-sketch-dark outline-none" />
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-sketch-dark text-white font-medium px-6 py-3 min-h-[44px] rounded-lg hover:bg-ink active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Se programează...' : 'Programează întâlnire'}
          </button>
          <Link href={`/admin/groups/${groupId}`} className="text-sm text-ink-lighter hover:text-ink font-medium px-4 py-3 min-h-[44px] flex items-center justify-center">Anulează</Link>
        </div>
      </form>
    </div>
  );
}
