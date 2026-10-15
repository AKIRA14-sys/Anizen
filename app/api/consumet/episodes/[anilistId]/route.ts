import { NextRequest, NextResponse } from "next/server";
import { getConsumetEpisodesByTitle } from "@/lib/consumet";

export const runtime = "nodejs";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

async function getAniListTitle(
  anilistId: string
): Promise<string | null> {
  const id = Number(anilistId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        title {
          english
          romaji
          native
        }
      }
    }
  `;

  const response = await fetch(ANILIST_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { id },
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AniList returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const title = data?.data?.Media?.title;

  return (
    title?.english ||
    title?.romaji ||
    title?.native ||
    null
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { anilistId: string } }
) {
  const { anilistId } = params;

  if (!anilistId || !/^\d+$/.test(anilistId)) {
    return NextResponse.json(
      {
        success: false,
        episodes: [],
        error: "Invalid AniList ID",
      },
      { status: 400 }
    );
  }

  try {
    const title = await getAniListTitle(anilistId);

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          episodes: [],
          error: "Anime title not found on AniList",
        },
        { status: 404 }
      );
    }

    const result = await getConsumetEpisodesByTitle(title);

    if (!result || result.episodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          animeId: null,
          provider: null,
          episodes: [],
          message: "No Consumet episodes found for this anime",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        animeId: result.animeId,
        provider: result.provider,
        episodes: result.episodes,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error(
      `[Consumet] Episode lookup failed for AniList ID ${anilistId}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        episodes: [],
        error: "Unable to retrieve Consumet episodes",
      },
      { status: 502 }
    );
  }
}