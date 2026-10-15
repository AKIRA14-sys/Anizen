import { NextRequest, NextResponse } from 'next/server';
import { getConsumetEpisodesResult } from '@/lib/consumet';

export async function GET(
  request: NextRequest,
  { params }: { params: { anilistId: string } }
) {
  const { anilistId } = params;

  if (!anilistId || isNaN(parseInt(anilistId, 10))) {
    return NextResponse.json(
      {
        success: false,
        anilistId: anilistId || null,
        episodes: [],
        errors: [{ provider: 'validation', message: 'Invalid or missing AniList ID' }],
        message: 'A valid numeric AniList ID is required.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await getConsumetEpisodesResult(anilistId);

    if (!result.success || result.episodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          anilistId,
          episodes: [],
          errors: result.errors,
          message: result.message || 'No Consumet episodes found for this anime.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error(`[API] Error in /api/consumet/episodes/${anilistId}:`, error?.message || error);
    return NextResponse.json(
      {
        success: false,
        anilistId,
        episodes: [],
        errors: [{ provider: 'server', message: 'An unexpected internal error occurred.' }],
        message: 'Failed to process episode discovery request.',
      },
      { status: 500 }
    );
  }
}
