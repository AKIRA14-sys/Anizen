import { NextRequest, NextResponse } from 'next/server';
import { getConsumetSources } from '@/lib/consumet';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get('episodeId');

  if (!episodeId) {
    return NextResponse.json({ error: 'Missing episodeId parameter' }, { status: 400 });
  }

  try {
    const data = await getConsumetSources(episodeId);
    if (!data) {
      return NextResponse.json({ success: false, sources: [], message: 'No sources found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...data }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error(`Error in /api/consumet/sources for episodeId ${episodeId}:`, error);
    return NextResponse.json({ success: false, sources: [], error: error.message }, { status: 500 });
  }
}
