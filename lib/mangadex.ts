import { MangaChapter, MangaChapterPages } from '@/types/manga';

const MANGADEX_API_URL = 'https://api.mangadex.org';

// Helper to search MangaDex by title string
export async function findMangaDexIdByTitle(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${MANGADEX_API_URL}/manga?title=${encodeURIComponent(title)}&limit=1&contentRating[]=safe&contentRating[]=suggestive`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return json.data[0].id;
    }
    return null;
  } catch (error) {
    console.error('Failed to search MangaDex by title:', error);
    return null;
  }
}

// Fetch available chapters for a MangaDex manga ID
export async function getMangaDexChapters(mangadexId: string, limit = 100): Promise<MangaChapter[]> {
  try {
    const url = `${MANGADEX_API_URL}/manga/${mangadexId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=${limit}&includes[]=scanlation_group&contentRating[]=safe&contentRating[]=suggestive`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const json = await res.json();

    if (!json.data || !Array.isArray(json.data)) return [];

    const chaptersMap = new Map<string, MangaChapter>();

    json.data.forEach((ch: any) => {
      const chapterNum = ch.attributes?.chapter || '1';
      // Deduplicate by chapter number if needed, keeping English ones
      if (!chaptersMap.has(chapterNum)) {
        let groupName = 'MangaDex';
        const groupRel = ch.relationships?.find((r: any) => r.type === 'scanlation_group');
        if (groupRel?.attributes?.name) {
          groupName = groupRel.attributes.name;
        }

        chaptersMap.set(chapterNum, {
          id: ch.id,
          chapterNumber: chapterNum,
          volumeNumber: ch.attributes?.volume || undefined,
          title: ch.attributes?.title || `Chapter ${chapterNum}`,
          language: ch.attributes?.translatedLanguage || 'en',
          pagesCount: ch.attributes?.pages || 0,
          publishAt: ch.attributes?.publishAt,
          scanlationGroup: groupName,
        });
      }
    });

    return Array.from(chaptersMap.values()).sort((a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber));
  } catch (error) {
    console.error(`Failed to fetch MangaDex chapters for ${mangadexId}:`, error);
    return [];
  }
}

// Fetch chapter page images using MangaDex @Home server endpoint
export async function getMangaDexChapterPages(chapterId: string): Promise<MangaChapterPages | null> {
  try {
    const res = await fetch(`${MANGADEX_API_URL}/at-home/server/${chapterId}`);
    if (!res.ok) return null;
    const json = await res.json();

    if (!json.chapter || !json.baseUrl) return null;

    const baseUrl = json.baseUrl;
    const hash = json.chapter.hash;
    const pageFilenames: string[] = json.chapter.data || [];

    // Construct full image URLs via MangaDex CDN
    const pageUrls = pageFilenames.map((filename) => `${baseUrl}/data/${hash}/${filename}`);

    return {
      chapterId,
      baseUrl,
      hash,
      pageFilenames,
      pageUrls,
    };
  } catch (error) {
    console.error(`Failed to fetch MangaDex chapter pages for ${chapterId}:`, error);
    return null;
  }
}
