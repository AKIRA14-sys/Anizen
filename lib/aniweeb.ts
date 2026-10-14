import { AniweebEpisodesResponse } from '@/types/anime';

const ANIWEEB_BASE_URL = 'https://api.aniweeb.net';

/**
 * Fetch episode list for a given AniList anime ID
 */
export async function getEpisodes(anilistId: number): Promise<AniweebEpisodesResponse | null> {
  try {
    const response = await fetch(`${ANIWEEB_BASE_URL}/episodes/${anilistId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }, // Cache episode lists for 30 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No episodes found on Aniweeb for AniList ID ${anilistId}`);
      } else {
        console.error(`Aniweeb API returned error HTTP ${response.status} for ID ${anilistId}`);
      }
      return null;
    }

    const data: AniweebEpisodesResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch episodes from Aniweeb for ID ${anilistId}:`, error);
    return null;
  }
}

/**
 * Construct Embed Player URL for a specific episode
 */
export function getEmbedUrl(anilistId: number, episodeNumber: number, track: 'sub' | 'dub' = 'sub'): string {
  return `${ANIWEEB_BASE_URL}/embed/ani/${anilistId}/${episodeNumber}?track=${track}`;
}
