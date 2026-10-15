import { NextRequest, NextResponse } from "next/server";
import { getConsumetSources } from "@/lib/consumet";

export const runtime = "nodejs";

const ALLOWED_PROVIDERS = new Set([
  "hianime",
  "animepahe",
  "animekai",
  "kickassanime",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get('episodeId');
  const provider = searchParams.get('provider') || undefined;

  if (!episodeId) {
    return NextResponse.json(
      {
        success: false,
        sources: [],
        message: 'Missing episodeId parameter',
      },
      { status: 400 }
    );
  }

  try {
    const data = await getConsumetSources(episodeId, provider);

    if (!data || (data.sources.length === 0 && !data.download && !data.embedUrl)) {
      return NextResponse.json(
        {
          success: false,
          sources: [],
          message: `No video sources found for episode ID: ${episodeId}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ...data,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error: any) {
    console.error(`[API] Error in /api/consumet/sources for episodeId ${episodeId}:`, error?.message || error);
    return NextResponse.json(
      {
        success: false,
        sources: [],
        message: 'Failed to extract video sources.',
      },
      { status: 500 }
    );
  }
}