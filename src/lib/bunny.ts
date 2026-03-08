export async function uploadToBunny(
  file: File,
  folder: string
): Promise<{ url: string; fileName: string } | null> {
  // 1. Get upload config from our API (auth check + path generation)
  const configRes = await fetch('/api/bunny/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, name: file.name }),
  });
  if (!configRes.ok) return null;
  const { uploadUrl, accessKey, fileUrl, fileName } = await configRes.json();

  // 2. Upload directly to Bunny Storage (bypasses Vercel's 4.5MB limit)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: accessKey,
      'Content-Type': 'application/octet-stream',
    },
    body: file,
  });
  if (!uploadRes.ok) return null;

  return { url: fileUrl, fileName };
}
