export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const encoded = searchParams.get('u');
  if (!encoded) return new Response('Bad Request', { status: 400 });

  let cdnUrl: string;
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    cdnUrl = Buffer.from(padded, 'base64').toString('utf-8');
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  try {
    const { hostname } = new URL(cdnUrl);
    if (!hostname.endsWith('cdninstagram.com') && !hostname.endsWith('fbcdn.net')) {
      return new Response('Forbidden', { status: 403 });
    }
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const upstreamHeaders: Record<string, string> = {};
  const range = request.headers.get('range');
  if (range) upstreamHeaders['range'] = range;

  try {
    const upstream = await fetch(cdnUrl, { headers: upstreamHeaders });
    const resHeaders: Record<string, string> = {
      'Cache-Control': 'public, max-age=3600',
    };
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const val = upstream.headers.get(key);
      if (val) resHeaders[key] = val;
    }
    return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
  } catch {
    return new Response('Bad Gateway', { status: 502 });
  }
}
