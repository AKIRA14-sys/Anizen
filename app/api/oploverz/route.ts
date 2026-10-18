import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (
  process.env.OPLOVERZ_API_BASE || 'https://wajik-anime-api-production-e7ef.up.railway.app'
).replace(/\/+$/, '');

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  let upstreamPath: string;

  if (action === 'search') {
    const q = (searchParams.get('q') || '').trim();
    if (!q) return jsonError('Missing search term.', 400);
    upstreamPath = `/oploverz/search?q=${encodeURIComponent(q)}`;
  } else if (action === 'anime' || action === 'episode') {
    const slug = searchParams.get('slug') || '';
    if (!SLUG_PATTERN.test(slug)) return jsonError('Invalid slug.', 400);
    upstreamPath = action === 'anime' ? `/oploverz/anime/${slug}` : `/oploverz/episode/${slug}`;
  } else {
    return jsonError('Unknown action. Use search, anime, or episode.', 400);
  }

  try {
    const upstream = await fetch(`${API_BASE}${upstreamPath}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
      next: { revalidate: 600 },
    });

    if (upstream.status === 404) {
      return NextResponse.json({ success: false, notFound: true, message: 'No results.' }, { status: 404 });
    }

    if (!upstream.ok) {
      return jsonError(`Oploverz source returned HTTP ${upstream.status}.`, 502);
    }

    const data = await upstream.json();
    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=1800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error: any) {
    console.error('[API] Oploverz proxy error:', error?.message || error);
    return jsonError('Could not reach the Oploverz source. Please try again shortly.', 502);
  }
}