export interface OploverzSearchCard {
  title: string;
  poster: string;
  type: string;
  status: string;
  slug: string;
  href: string;
}

export interface OploverzEpisodeItem {
  episode: string;
  title: string;
  date: string;
  href: string;
}

export interface OploverzAnimeDetails {
  title: string;
  poster: string;
  status: string;
  studio: string;
  duration: string;
  season: string;
  type: string;
  rating: string;
  releasedOn: string;
  updatedOn: string;
  synopsis: { paragraphList: string[] };
  genres: string[];
  episodeList: OploverzEpisodeItem[];
}

export interface OploverzDownloadUrl {
  title: string;
  url: string;
}

export interface OploverzDownloadQuality {
  title: string;
  urlList: OploverzDownloadUrl[];
}

export interface OploverzDownloadFormat {
  title: string;
  qualityList: OploverzDownloadQuality[];
}

export interface OploverzEpisodeDetails {
  title: string;
  episodeNumber: string;
  seriesName: string;
  seriesSlug: string;
  streamingUrl: string;
  releasedOn: string;
  hasPrevEpisode: boolean;
  prevEpisode: { title: string; href: string } | null;
  download: OploverzDownloadFormat[];
}

/**
 * Turns an episode or series href (absolute or relative) into the last path
 * segment, which is the slug the Wajik API expects.
 */
export function slugFromHref(href: string): string {
  try {
    const url = new URL(href, 'https://placeholder.invalid');
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  } catch {
    return '';
  }
}

async function callProxy<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/oploverz?${qs}`);

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.status === 404 || body?.notFound) {
    const err = new Error('No results.');
    (err as any).notFound = true;
    throw err;
  }
  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `Request failed with status ${res.status}.`);
  }
  return body as T;
}

export async function searchOploverz(q: string): Promise<OploverzSearchCard[]> {
  const body = await callProxy<{ data?: { animeList?: OploverzSearchCard[] } }>({
    action: 'search',
    q,
  });
  return body.data?.animeList ?? [];
}

export async function getOploverzAnime(slug: string): Promise<OploverzAnimeDetails> {
  const body = await callProxy<{ data?: { details?: OploverzAnimeDetails } }>({
    action: 'anime',
    slug,
  });
  if (!body.data?.details) throw new Error('The anime details came back empty.');
  return body.data.details;
}

export async function getOploverzEpisode(slug: string): Promise<OploverzEpisodeDetails> {
  const body = await callProxy<{ data?: { details?: OploverzEpisodeDetails } }>({
    action: 'episode',
    slug,
  });
  if (!body.data?.details) throw new Error('The episode details came back empty.');
  return body.data.details;
}