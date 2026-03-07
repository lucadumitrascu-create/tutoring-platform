'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Lesson, Material, Homework } from '@/types/database';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    async function loadData() {
      // Get lesson
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single() as { data: Lesson | null };

      if (!lessonData) {
        router.push('/lessons');
        return;
      }
      setLesson(lessonData);

      // Get auth user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Check access: free or approved access_status
      if (lessonData.is_free) {
        setHasAccess(true);
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('access_status')
          .eq('id', user.id)
          .single() as { data: { access_status: string } | null };

        setHasAccess(profile?.access_status === 'approved');
      }

      // Fetch materials
      const { data: mats } = await supabase
        .from('materials')
        .select('*')
        .eq('lesson_id', id)
        .order('created_at', { ascending: true }) as { data: Material[] | null };

      setMaterials(mats ?? []);

      // Fetch student's homework for this lesson
      const { data: hw } = await supabase
        .from('homework')
        .select('*')
        .eq('lesson_id', id)
        .eq('student_id', user.id)
        .maybeSingle() as { data: Homework | null };

      setHomework(hw);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleHomeworkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    setUploadError('');

    const filePath = `${userId}/${id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from('homework')
      .upload(filePath, file);

    if (uploadErr) {
      setUploadError('Failed to upload file. Please try again.');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('homework')
      .getPublicUrl(filePath);

    // Insert or update homework record
    if (homework) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated } = await (supabase as any)
        .from('homework')
        .update({
          file_url: urlData.publicUrl,
          file_name: file.name,
          status: 'submitted',
          feedback: null,
        })
        .eq('id', homework.id)
        .select()
        .single() as { data: Homework | null };

      setHomework(updated);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted } = await (supabase as any)
        .from('homework')
        .insert({
          lesson_id: id,
          student_id: userId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          status: 'submitted',
        })
        .select()
        .single() as { data: Homework | null };

      setHomework(inserted);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!lesson) return null;

  // Not purchased paid lesson — show CTA
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <Link href="/lessons" className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Back to lessons</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{lesson.title}</h1>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">{lesson.description}</p>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">This lesson requires access</h2>
          <p className="text-gray-500 text-sm mb-2">Contact the teacher to get access to this lesson.</p>
          <p className="text-2xl font-bold text-gray-900 mb-6">${lesson.price.toFixed(2)}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-medium px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link href="/lessons" className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Back to lessons</Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          {lesson.is_free && (
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Free</span>
          )}
        </div>
        <p className="text-gray-500">{lesson.description}</p>
      </div>

      {/* Live session */}
      {lesson.meet_link && lesson.scheduled_at && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-semibold text-primary-900 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Live Session
              </h2>
              <p className="text-sm text-primary-700">
                {new Date(lesson.scheduled_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <a
              href={lesson.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0"
            >
              Join Live Session
            </a>
          </div>
        </div>
      )}

      {/* Materials */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Materials</h2>
        {materials.length > 0 ? (
          <div className="space-y-3">
            {materials.map((mat) => {
              const isImage = mat.file_type.startsWith('image/');
              const isVideo = mat.file_type.startsWith('video/') || mat.file_url.includes('iframe.mediadelivery.net');
              const isPdf = mat.file_type === 'application/pdf';

              return (
                <div key={mat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {isImage && (
                    <img
                      src={mat.file_url}
                      alt={mat.file_name}
                      className="w-full max-h-96 object-contain bg-gray-50"
                    />
                  )}
                  {isVideo && (
                    <div className="aspect-video">
                      <iframe
                        src={mat.file_url}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; fullscreen"
                      />
                    </div>
                  )}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {isPdf ? (
                          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        ) : isImage ? (
                          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{mat.file_name}</span>
                    </div>
                    {(isPdf || !isVideo) && (
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={isPdf ? mat.file_name : undefined}
                        className="text-sm text-primary-600 font-medium hover:underline flex-shrink-0 ml-4"
                      >
                        {isPdf ? 'Download' : 'Open'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 border-dashed rounded-xl p-8 text-center">
            <p className="text-gray-400">No materials uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Homework section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Homework</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {/* Current homework status */}
          {homework && (
            <div className="mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Your submission</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  homework.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : homework.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {homework.status === 'submitted' ? 'Pending Review' : homework.status.charAt(0).toUpperCase() + homework.status.slice(1)}
                </span>
              </div>
              <a
                href={homework.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline"
              >
                {homework.file_name}
              </a>
              {homework.feedback && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Feedback from teacher</p>
                  <p className="text-sm text-gray-700">{homework.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Upload */}
          <div>
            <p className="text-sm text-gray-500 mb-3">
              {homework ? 'Upload a new file to resubmit your homework.' : 'Upload your homework file below.'}
            </p>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleHomeworkUpload}
                disabled={uploading}
              />
              {uploading ? (
                <svg className="animate-spin w-5 h-5 text-primary-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
              <span className="text-sm text-gray-500">
                {uploading ? 'Uploading...' : 'Click to choose a file'}
              </span>
            </label>
            {uploadError && (
              <p className="text-sm text-red-600 mt-2">{uploadError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
