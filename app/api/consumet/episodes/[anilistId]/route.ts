import { NextRequest, NextResponse } from 'next/server';
import { getConsumetEpisodes } from '@/lib/consumet';

export async function GET(
  request: NextRequest,
  { params }: { params: { anilistId: string } }
) {
  const { anilistId } = params;

  if (!anilistId) {
    return NextResponse.json({ error: 'Missing anilistId' }, { status: 400 });
  }

  try {
    const episodes = await getConsumetEpisodes(anilistId);
    return NextResponse.json({ success: true, episodes }, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error(`Error in /api/consumet/episodes/${anilistId}:`, error);
    return NextResponse.json({ success: false, episodes: [], error: error.message }, { status: 500 });
  }
}
