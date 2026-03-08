import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { folder = '', name = 'file' } = await request.json();

    const apiKey = process.env.BUNNY_API_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
    const cdnUrl = process.env.BUNNY_CDN_URL;

    if (!apiKey || !storageZone || !cdnUrl) {
      return NextResponse.json({ error: 'Bunny.net is not configured' }, { status: 500 });
    }

    const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${sanitizedName}`;
    const path = folder ? `${folder}/${fileName}` : fileName;

    return NextResponse.json({
      uploadUrl: `https://storage.bunnycdn.com/${storageZone}/${path}`,
      accessKey: apiKey,
      fileUrl: `${cdnUrl}/${path}`,
      fileName: name,
    });
  } catch (error) {
    console.error('Upload config error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
