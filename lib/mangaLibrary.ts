import { MangaMedia, MangaLibraryItem, MangaLibraryCategory } from '@/types/manga';
import { getMangaTitle } from '@/lib/manga';

const MANGA_LIBRARY_KEY = 'anizen_manga_library';

export function getMangaLibrary(): MangaLibraryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MANGA_LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isInMangaLibrary(id: number): boolean {
  const list = getMangaLibrary();
  return list.some((item) => item.id === id);
}

export function addToMangaLibrary(
  manga: MangaMedia,
  category: MangaLibraryCategory = 'Plan to Read'
): MangaLibraryItem[] {
  if (typeof window === 'undefined') return [];
  const list = getMangaLibrary();
  const existingIndex = list.findIndex((item) => item.id === manga.id);

  if (existingIndex >= 0) {
    list[existingIndex].category = category;
    try {
      localStorage.setItem(MANGA_LIBRARY_KEY, JSON.stringify(list));
    } catch {}
    return list;
  } else {
    const newItem: MangaLibraryItem = {
      id: manga.id,
      title: getMangaTitle(manga),
      coverImage: manga.coverImage.extraLarge || manga.coverImage.large || manga.coverImage.medium || '',
      bannerImage: manga.bannerImage,
      meanScore: manga.meanScore || manga.averageScore,
      addedAt: Date.now(),
      category,
    };
    const updated = [newItem, ...list];
    try {
      localStorage.setItem(MANGA_LIBRARY_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  }
}

export function removeFromMangaLibrary(id: number): MangaLibraryItem[] {
  if (typeof window === 'undefined') return [];
  const list = getMangaLibrary();
  const updated = list.filter((item) => item.id !== id);
  try {
    localStorage.setItem(MANGA_LIBRARY_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function toggleMangaLibrary(
  manga: MangaMedia,
  category: MangaLibraryCategory = 'Plan to Read'
): { updatedList: MangaLibraryItem[]; isSaved: boolean } {
  if (isInMangaLibrary(manga.id)) {
    const updatedList = removeFromMangaLibrary(manga.id);
    return { updatedList, isSaved: false };
  } else {
    const updatedList = addToMangaLibrary(manga, category);
    return { updatedList, isSaved: true };
  }
}
