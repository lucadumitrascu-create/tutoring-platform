'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Post, PostFile } from '@/types/database';

export default function StudentPostDetailPage() {
  const { id: groupId, postId } = useParams<{ id: string; postId: string }>();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [files, setFiles] = useState<PostFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: postData } = await (supabase as any).from('posts').select('*').eq('id', postId).single() as { data: Post | null };
      setPost(postData);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: filesData } = await (supabase as any).from('post_files').select('*').eq('post_id', postId).order('sort_order') as { data: PostFile[] | null };
      setFiles(filesData ?? []);
      setLoading(false);
    }
    load();
  }, [postId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><svg className="animate-spin w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  if (!post) return <p className="text-gray-500 py-12 text-center">Post not found.</p>;

  return (
    <div className="max-w-4xl">
      <Link href={`/groups/${groupId}`} className="text-sm text-primary-600 hover:underline mb-6 inline-block">&larr; Back to group</Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
      <p className="text-xs text-gray-400 mb-6">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      {post.description && <p className="text-gray-600 mb-8 whitespace-pre-wrap">{post.description}</p>}

      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((f) => {
            if (f.file_type.startsWith('video/')) {
              return (
                <div key={f.id} className="rounded-xl overflow-hidden bg-black">
                  <video controls className="w-full max-h-[500px]" preload="metadata">
                    <source src={f.file_url} type={f.file_type} />
                  </video>
                  <p className="text-xs text-gray-400 px-4 py-2 bg-gray-900">{f.file_name}</p>
                </div>
              );
            }
            if (f.file_type.startsWith('image/')) {
              return (
                <div key={f.id}>
                  <img src={f.file_url} alt={f.file_name} className="rounded-xl max-w-full border border-gray-200" />
                  <p className="text-xs text-gray-400 mt-1">{f.file_name}</p>
                </div>
              );
            }
            if (f.file_type === 'application/pdf') {
              return (
                <div key={f.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <iframe src={f.file_url} className="w-full h-[600px]" title={f.file_name} />
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-700">{f.file_name}</p>
                    <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 font-medium hover:underline">Open in new tab</a>
                  </div>
                </div>
              );
            }
            return (
              <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-primary-300 transition-all">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <span className="text-sm text-gray-700">{f.file_name}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
