'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Lesson } from '@/types/database';

interface PendingMaterial {
  id: string;
  file: File | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  source: 'supabase' | 'bunny';
  uploading: boolean;
  progress: number;
  error: string;
  done: boolean;
}

export default function NewLessonPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [materials, setMaterials] = useState<PendingMaterial[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addMaterialFiles(files: FileList | null) {
    if (!files) return;
    const newMats: PendingMaterial[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      fileName: file.name,
      fileUrl: '',
      fileType: file.type,
      source: file.type.startsWith('video/') ? 'bunny' as const : 'supabase' as const,
      uploading: false,
      progress: 0,
      error: '',
      done: false,
    }));
    setMaterials((prev) => [...prev, ...newMats]);
  }

  function removeMaterial(id: string) {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  async function uploadMaterial(mat: PendingMaterial): Promise<{ url: string; fileName: string } | null> {
    if (!mat.file) return null;

    if (mat.source === 'bunny') {
      // Upload video via Bunny API
      const formData = new FormData();
      formData.append('file', mat.file);

      const res = await fetch('/api/bunny/upload', { method: 'POST', body: formData });
      if (!res.ok) return null;

      const data = await res.json();
      return { url: data.url, fileName: data.fileName };
    } else {
      // Upload to Supabase Storage
      const filePath = `lessons/${Date.now()}_${mat.file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('materials')
        .upload(filePath, mat.file);

      if (uploadErr) return null;

      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      return { url: urlData.publicUrl, fileName: mat.file.name };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);

    try {
      // Create lesson
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lesson, error: lessonErr } = await (supabase as any)
        .from('lessons')
        .insert({
          title: title.trim(),
          description: description.trim(),
          price: isFree ? 0 : parseFloat(price) || 0,
          is_free: isFree,
          scheduled_at: scheduledAt || null,
          meet_link: meetLink.trim() || null,
        })
        .select()
        .single() as { data: Lesson | null; error: { message: string } | null };

      if (lessonErr || !lesson) {
        setError(lessonErr?.message || 'Failed to create lesson.');
        setSaving(false);
        return;
      }

      // Get auth user for uploaded_by
      const { data: { user } } = await supabase.auth.getUser();

      // Upload materials one by one
      for (let i = 0; i < materials.length; i++) {
        const mat = materials[i];
        setMaterials((prev) =>
          prev.map((m) => (m.id === mat.id ? { ...m, uploading: true, progress: 50 } : m))
        );

        const result = await uploadMaterial(mat);

        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('materials').insert({
            lesson_id: lesson.id,
            file_url: result.url,
            file_type: mat.fileType,
            file_name: result.fileName,
            uploaded_by: user?.id,
          });

          setMaterials((prev) =>
            prev.map((m) => (m.id === mat.id ? { ...m, uploading: false, progress: 100, done: true } : m))
          );
        } else {
          setMaterials((prev) =>
            prev.map((m) => (m.id === mat.id ? { ...m, uploading: false, error: 'Upload failed' } : m))
          );
        }
      }

      router.push('/admin/lessons');
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/lessons" className="text-sm text-primary-600 hover:underline mb-6 inline-block">
        &larr; Back to lessons
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Lesson</h1>
      <p className="text-gray-500 mb-8">Add a lesson with materials and scheduling.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="e.g. Introduction to Algebra"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            placeholder="Describe what students will learn..."
          />
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pricing</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Free lesson</span>
            </label>
            {!isFree && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Scheduled date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Scheduled Date & Time <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        {/* Meet link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Google Meet Link <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="https://meet.google.com/..."
          />
        </div>

        {/* Materials upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Materials</label>
          <p className="text-xs text-gray-400 mb-3">
            Upload PDFs, images, or videos. Videos will be uploaded via Bunny.net.
          </p>

          {/* File list */}
          {materials.length > 0 && (
            <div className="space-y-2 mb-4">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {mat.fileType.startsWith('video/') ? (
                      <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    ) : mat.fileType === 'application/pdf' ? (
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    )}
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{mat.fileName}</p>
                    {mat.uploading && (
                      <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-300"
                          style={{ width: `${mat.progress}%` }}
                        />
                      </div>
                    )}
                    {mat.done && <p className="text-xs text-green-600 mt-0.5">Uploaded</p>}
                    {mat.error && <p className="text-xs text-red-500 mt-0.5">{mat.error}</p>}
                  </div>

                  {/* Source badge */}
                  <span className="text-[10px] font-medium text-gray-400 uppercase flex-shrink-0">
                    {mat.source === 'bunny' ? 'Video' : mat.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>

                  {/* Remove */}
                  {!mat.uploading && !mat.done && (
                    <button
                      type="button"
                      onClick={() => removeMaterial(mat.id)}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add files button */}
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
            <input
              type="file"
              multiple
              className="hidden"
              accept="image/*,application/pdf,video/*"
              onChange={(e) => addMaterialFiles(e.target.files)}
            />
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm text-gray-500">Click to add files</span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? 'Creating...' : 'Create Lesson'}
          </button>
          <Link
            href="/admin/lessons"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
