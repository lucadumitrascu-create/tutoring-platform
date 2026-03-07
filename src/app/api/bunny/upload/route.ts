import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const apiKey = process.env.BUNNY_API_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
    const cdnUrl = process.env.BUNNY_CDN_URL;

    if (!apiKey || !storageZone || apiKey === 'xxx') {
      return NextResponse.json({ error: 'Bunny.net is not configured' }, { status: 500 });
    }

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Bunny Storage
    const uploadRes = await fetch(
      `https://storage.bunnycdn.com/${storageZone}/${fileName}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.error('Bunny upload error:', text);
      return NextResponse.json({ error: 'Upload to Bunny failed' }, { status: 500 });
    }

    const fileUrl = `${cdnUrl}/${fileName}`;
    return NextResponse.json({ url: fileUrl, fileName: file.name });
  } catch (error) {
    console.error('Bunny upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
