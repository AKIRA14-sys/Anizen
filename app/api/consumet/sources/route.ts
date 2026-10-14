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

  const episodeId = searchParams.get("episodeId")?.trim();
  const providerName = searchParams.get("provider")?.trim();

  if (!episodeId || !providerName) {
    return NextResponse.json(
      {
        success: false,
        sources: [],
        error: "episodeId and provider are required",
      },
      { status: 400 }
    );
  }

  if (!ALLOWED_PROVIDERS.has(providerName)) {
    return NextResponse.json(
      {
        success: false,
        sources: [],
        error: "Unsupported Consumet provider",
      },
      { status: 400 }
    );
  }

  try {
    const data = await getConsumetSources(
      episodeId,
      providerName
    );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          sources: [],
          subtitles: [],
          message: "No streaming sources are available",
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
          "Cache-Control":
            "public, max-age=300, s-maxage=600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error(
      `[Consumet] Source lookup failed for ${providerName}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        sources: [],
        error: "Unable to retrieve streaming sources",
      },
      { status: 502 }
    );
  }
}