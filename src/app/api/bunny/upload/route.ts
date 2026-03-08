import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (any logged-in user can upload)
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const folder = url.searchParams.get('folder') || '';
    const originalName = url.searchParams.get('name') || 'file';

    const apiKey = process.env.BUNNY_API_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
    const cdnUrl = process.env.BUNNY_CDN_URL;

    if (!apiKey || !storageZone || !cdnUrl) {
      return NextResponse.json({ error: 'Bunny.net is not configured' }, { status: 500 });
    }

    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${sanitizedName}`;
    const path = folder ? `${folder}/${fileName}` : fileName;

    // Stream body directly to Bunny Storage (no buffering = no size limit)
    const uploadRes = await fetch(
      `https://storage.bunnycdn.com/${storageZone}/${path}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: request.body,
        // @ts-expect-error duplex is required for streaming request body
        duplex: 'half',
      }
    );

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.error('Bunny upload error:', text);
      return NextResponse.json({ error: 'Upload to Bunny failed' }, { status: 500 });
    }

    const fileUrl = `${cdnUrl}/${path}`;
    return NextResponse.json({ url: fileUrl, fileName: originalName });
  } catch (error) {
    console.error('Bunny upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
