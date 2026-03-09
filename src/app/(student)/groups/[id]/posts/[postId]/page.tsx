'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Post, PostFile } from '@/types/database';
import { SkeletonLine } from '@/components/ui/Skeleton';
import FilePreviewModal from '@/components/ui/FilePreviewModal';

export default function StudentPostDetailPage() {
  const { id: groupId, postId } = useParams<{ id: string; postId: string }>();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [files, setFiles] = useState<PostFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data: postData } = await supabase.from('posts').select('*').eq('id', postId).single() as { data: Post | null };
      setPost(postData);

      const { data: filesData } = await supabase.from('post_files').select('*').eq('post_id', postId).order('sort_order') as { data: PostFile[] | null };
      setFiles(filesData ?? []);
      setLoading(false);

      // Mark as read
      const { data: { user } } = await supabase.auth.getUser();
      if (user && postData) {
        await supabase.from('post_reads').upsert(
          { user_id: user.id, post_id: postId },
          { onConflict: 'user_id,post_id' }
        );
      }
    }
    load();
  }, [postId]);

  // Build previewable files list (images + pdfs)
  const previewableFiles = files.filter((f) => f.file_type.startsWith('image/') || f.file_type === 'application/pdf');
  const previewFilesForModal = previewableFiles.map((f) => ({ url: f.file_url, type: f.file_type, name: f.file_name }));

  function openPreview(file: PostFile) {
    const idx = previewableFiles.findIndex((f) => f.id === file.id);
    if (idx >= 0) setPreviewIndex(idx);
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <SkeletonLine className="h-4 w-24 mb-6" />
        <SkeletonLine className="h-8 w-2/3 mb-2" />
        <SkeletonLine className="h-4 w-32 mb-6" />
        <SkeletonLine className="h-20 w-full mb-8" />
        <div className="space-y-4">
          <SkeletonLine className="h-48 w-full rounded-xl" />
          <SkeletonLine className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) return <p className="text-ink-lighter py-12 text-center">Postarea nu a fost găsită.</p>;

  return (
    <div className="max-w-4xl">
      <Link href={`/groups/${groupId}`} className="text-sm text-sketch-dark hover:underline mb-6 inline-flex items-center gap-1 py-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Înapoi la grup
      </Link>

      <h1 className="text-2xl font-bold text-ink mb-2 font-hand">{post.title}</h1>
      <p className="text-xs text-ink-muted mb-6">{new Date(post.created_at).toLocaleDateString('ro-RO', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      {post.description && <p className="text-ink-light mb-8 whitespace-pre-wrap">{post.description}</p>}

      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((f) => {
            if (f.file_type.startsWith('video/')) {
              return (
                <div key={f.id} className="rounded-2xl overflow-hidden bg-black">
                  <video controls className="w-full max-h-[500px]" preload="metadata">
                    <source src={f.file_url} type={f.file_type} />
                  </video>
                  <p className="text-xs text-ink-muted px-4 py-2 bg-ink">{f.file_name}</p>
                </div>
              );
            }
            if (f.file_type.startsWith('image/')) {
              return (
                <div key={f.id} className="cursor-pointer" onClick={() => openPreview(f)}>
                  <img src={f.file_url} alt={f.file_name} className="rounded-2xl max-w-full border border-sketch hover:shadow-md transition-shadow" />
                  <p className="text-xs text-ink-muted mt-1">{f.file_name}</p>
                </div>
              );
            }
            if (f.file_type === 'application/pdf') {
              return (
                <div key={f.id} className="border border-sketch rounded-2xl overflow-hidden">
                  <iframe src={f.file_url} className="w-full h-[600px]" title={f.file_name} />
                  <div className="flex items-center justify-between px-4 py-3 bg-[#f0e8d8] border-t border-sketch">
                    <p className="text-sm text-ink">{f.file_name}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openPreview(f)} className="text-sm text-sketch-dark font-medium hover:underline">Ecran complet</button>
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sketch-dark font-medium hover:underline">Deschide în tab nou</a>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-paper border border-sketch rounded-2xl px-5 py-4 hover:border-sketch hover:shadow-sm active:scale-[0.99] transition-all min-h-[44px]">
                <svg className="w-5 h-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <span className="text-sm text-ink">{f.file_name}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {previewIndex !== null && (
        <FilePreviewModal
          files={previewFilesForModal}
          currentIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
        />
      )}
    </div>
  );
}
