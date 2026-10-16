'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Bookmark, Check, BookOpen, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { MangaMedia, MangaChapter } from '@/types/manga';
import { getMangaById, getMangaTitle, cleanDescription } from '@/lib/manga';
import { isInMangaLibrary, toggleMangaLibrary } from '@/lib/mangaLibrary';

interface MangaDetailsPageProps {
  params: { id: string };
}

export default function MangaDetailsPage({ params }: MangaDetailsPageProps) {
  const mangaId = parseInt(params.id, 10);
  const [manga, setManga] = useState<MangaMedia | null>(null);
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [mangadexId, setMangadexId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isNaN(mangaId)) return;

    setIsSaved(isInMangaLibrary(mangaId));

    async function loadData() {
      setLoading(true);
      const media = await getMangaById(mangaId);
      setManga(media);
      setLoading(false);

      if (media) {
        setLoadingChapters(true);
        const titleToSearch = media.title.english || media.title.romaji || 'Manga';
        try {
          const res = await fetch(`/api/mangadex/chapters?title=${encodeURIComponent(titleToSearch)}`);
          const json = await res.json();
          if (res.ok && json.success) {
            setChapters(json.chapters || []);
            setMangadexId(json.mangadexId || null);
          }
        } catch (e) {
          console.error('Failed to load chapters:', e);
        } finally {
          setLoadingChapters(false);
        }
      }
    }

    loadData();
  }, [mangaId]);

  const handleToggleLibrary = () => {
    if (!manga) return;
    const { isSaved: newSaved } = toggleMangaLibrary(manga);
    setIsSaved(newSaved);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-brand-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Loading manga details...</p>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-brand-accent mb-3" />
        <h1 className="text-2xl font-bold text-white">Manga Not Found</h1>
        <p className="mt-2 text-sm text-brand-muted">The requested manga details could not be found.</p>
        <Link
          href="/manga"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold text-white shadow-glow"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Manga Catalog
        </Link>
      </div>
    );
  }

  const title = getMangaTitle(manga);
  const synopsis = cleanDescription(manga.description);
  const coverUrl = manga.coverImage.extraLarge || manga.coverImage.large;
  const bannerUrl = manga.bannerImage || coverUrl;
  const score = manga.meanScore || manga.averageScore;

  const firstChapter = chapters.length > 0 ? chapters[0] : null;

  return (
    <div className="min-h-screen pb-16">
      {/* Banner */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-brand-dark">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-40 blur-xs"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent" />
      </div>

      {/* Main Details Area */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 -mt-32 sm:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Poster */}
          <div className="flex flex-col items-center md:items-start shrink-0">
            <div className="relative aspect-[3/4] w-48 sm:w-60 md:w-64 overflow-hidden rounded-2xl border-2 border-brand-border bg-brand-surface shadow-2xl">
              {coverUrl ? (
                <Image src={coverUrl} alt={title} fill priority sizes="256px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">No Cover</div>
              )}
            </div>

            <div className="mt-4 flex w-full flex-col gap-2.5 max-w-[256px]">
              {firstChapter ? (
                <Link
                  href={`/manga/${manga.id}/read?chapterId=${firstChapter.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-accent py-3 font-bold text-white shadow-glow transition-transform hover:scale-[1.02]"
                >
                  <BookOpen className="h-5 w-5 text-white" />
                  <span>READ CHAPTER 1</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 font-bold text-gray-500 cursor-not-allowed"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>CHAPTERS UNAVAILABLE</span>
                </button>
              )}

              <button
                onClick={handleToggleLibrary}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-semibold transition-all ${
                  isSaved
                    ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                    : 'border-brand-border bg-brand-surface text-white hover:bg-brand-border/60'
                }`}
              >
                {isSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                <span className="text-sm">{isSaved ? 'In Manga Library' : 'Add to Manga Library'}</span>
              </button>
            </div>
          </div>

          {/* Right Info Column */}
          <div className="flex-1 text-white">
            <Link
              href="/manga"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-accent mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Manga Catalog
            </Link>

            <h1 className="text-2xl font-black sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-3">
              {title}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-brand-muted mb-6">
              {score && (
                <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                  <Star className="h-4 w-4 fill-amber-400" />
                  {(score / 10).toFixed(1)} Rating
                </span>
              )}
              {manga.status && (
                <span className="bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border text-emerald-400 font-bold">
                  {manga.status}
                </span>
              )}
              {manga.chapters && (
                <span className="bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border">
                  {manga.chapters} Chapters
                </span>
              )}
            </div>

            {/* Genres */}
            {manga.genres && manga.genres.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {manga.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-lg bg-brand-surface border border-brand-border px-3 py-1 text-xs font-semibold text-brand-text"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            <div className="mb-8 rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6">
              <h2 className="text-base font-bold text-white mb-2">Synopsis</h2>
              <p className="text-sm text-brand-muted leading-relaxed whitespace-pre-line">{synopsis}</p>
            </div>

            {/* Chapter List */}
            <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-brand-border/60 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="h-4 w-1.5 rounded-full bg-brand-accent inline-block" />
                  <span>Chapters</span>
                </h2>
                <span className="text-xs text-brand-muted font-medium">
                  {chapters.length} Available
                </span>
              </div>

              {loadingChapters ? (
                <div className="py-8 text-center text-sm text-brand-muted flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
                  <span>Searching MangaDex chapters...</span>
                </div>
              ) : chapters.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {chapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/manga/${manga.id}/read?chapterId=${ch.id}`}
                      className="group flex flex-col justify-between rounded-xl border border-brand-border/80 bg-brand-dark p-3 transition-all hover:border-brand-accent hover:bg-brand-accent/10"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-brand-accent">
                          CH {ch.chapterNumber}
                        </span>
                        <BookOpen className="h-3.5 w-3.5 text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[11px] text-brand-muted line-clamp-1">
                        {ch.title || `Chapter ${ch.chapterNumber}`}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-brand-muted">
                  <AlertCircle className="mx-auto h-8 w-8 text-brand-border mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">No readable chapters found on MangaDex</p>
                  <p className="text-xs text-brand-muted max-w-sm mx-auto">
                    No English chapters were indexed for this title on MangaDex. You can save it to your library to track updates.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
