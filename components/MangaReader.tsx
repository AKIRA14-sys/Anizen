'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  AlertTriangle,
  Settings,
  BookOpen,
  ArrowDownUp,
  ArrowLeftRight,
} from 'lucide-react';
import { MangaMedia, MangaChapter, MangaChapterPages, ReadingDirection, ReadingMode } from '@/types/manga';
import { saveReadingProgress } from '@/lib/readingProgress';

interface MangaReaderProps {
  manga: MangaMedia;
  chapters: MangaChapter[];
  initialChapterId: string;
}

export default function MangaReader({ manga, chapters, initialChapterId }: MangaReaderProps) {
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [pagesData, setPagesData] = useState<MangaChapterPages | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Settings
  const [direction, setDirection] = useState<ReadingDirection>('rtl');
  const [readingMode, setReadingMode] = useState<ReadingMode>('webtoon');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentChapter = chapters.find((c) => c.id === currentChapterId) || chapters[0];
  const currentChapterIndex = chapters.findIndex((c) => c.id === currentChapterId);

  const hasPrevChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1;

  // Load Chapter Pages from API
  useEffect(() => {
    if (!currentChapterId) return;

    async function loadPages() {
      setLoading(true);
      setError(null);
      setImageErrors({});
      setCurrentPage(1);

      try {
        const res = await fetch(`/api/mangadex/pages?chapterId=${currentChapterId}`);
        const json = await res.json();

        if (res.ok && json.success && json.pages?.pageUrls?.length > 0) {
          setPagesData(json.pages);
        } else {
          setError(json.message || 'No page images available for this chapter.');
        }
      } catch (err: any) {
        setError('Failed to fetch chapter pages from server.');
      } finally {
        setLoading(false);
      }
    }

    loadPages();
  }, [currentChapterId]);

  // Track & Save Reading Progress
  useEffect(() => {
    if (currentChapter && pagesData && pagesData.pageUrls.length > 0) {
      saveReadingProgress({
        mangaId: manga.id,
        mangaTitle: manga.title.english || manga.title.romaji || 'Manga',
        coverImage: manga.coverImage.large || manga.coverImage.medium || '',
        chapterId: currentChapter.id,
        chapterNumber: currentChapter.chapterNumber,
        pageNumber: currentPage,
        totalPages: pagesData.pageUrls.length,
        updatedAt: Date.now(),
        readingDirection: direction,
        readingMode,
      });
    }
  }, [manga, currentChapter, currentPage, pagesData, direction, readingMode]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrevChapter = () => {
    if (hasPrevChapter) {
      setCurrentChapterId(chapters[currentChapterIndex - 1].id);
    }
  };

  const handleNextChapter = () => {
    if (hasNextChapter) {
      setCurrentChapterId(chapters[currentChapterIndex + 1].id);
    }
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const handleRetryImage = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: false }));
  };

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col bg-black text-white selection:bg-brand-accent selection:text-white"
    >
      {/* Top Header Controls Bar */}
      {showControls && (
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-brand-border/60 bg-brand-dark/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              href={`/manga/${manga.id}`}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <div className="border-l border-brand-border/60 pl-3">
              <h1 className="text-xs sm:text-sm font-extrabold text-white line-clamp-1">
                {manga.title.english || manga.title.romaji || 'Manga'}
              </h1>
              <p className="text-[10px] text-brand-accent font-bold">
                Chapter {currentChapter?.chapterNumber || '1'}
              </p>
            </div>
          </div>

          {/* Controls & Mode Selectors */}
          <div className="flex items-center gap-2">
            {/* Reading Mode Toggle */}
            <button
              onClick={() => setReadingMode(readingMode === 'webtoon' ? 'single' : 'webtoon')}
              className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-[11px] font-bold text-brand-text hover:border-brand-accent transition-all"
              title="Toggle Single Page vs Webtoon Vertical Mode"
            >
              <ArrowDownUp className="h-3.5 w-3.5 text-brand-accent" />
              <span className="hidden sm:inline">{readingMode === 'webtoon' ? 'Webtoon' : 'Single'}</span>
            </button>

            {/* Reading Direction Toggle */}
            {readingMode === 'single' && (
              <button
                onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')}
                className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-1 text-[11px] font-bold text-brand-text hover:border-brand-accent transition-all"
                title="Toggle Reading Direction"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-brand-accent" />
                <span>{direction.toUpperCase()}</span>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:text-white"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </header>
      )}

      {/* Main Reader View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {loading ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-brand-muted">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent mb-3" />
            <p className="text-xs font-semibold">Retrieving chapter pages from MangaDex...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 bg-brand-surface rounded-2xl border border-brand-border max-w-md">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
            <h2 className="text-base font-bold text-white mb-1">Chapter Content Unavailable</h2>
            <p className="text-xs text-brand-muted mb-4">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentChapterId(currentChapterId)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white shadow-glow"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
              <Link
                href={`/manga/${manga.id}`}
                className="rounded-xl border border-brand-border bg-brand-dark px-4 py-2 text-xs font-bold text-white"
              >
                Chapter List
              </Link>
            </div>
          </div>
        ) : pagesData && pagesData.pageUrls.length > 0 ? (
          readingMode === 'webtoon' ? (
            /* Vertical Continuous Webtoon Scroll */
            <div className="flex flex-col items-center max-w-3xl w-full gap-1 sm:gap-2">
              {pagesData.pageUrls.map((url, idx) => (
                <div key={idx} className="relative w-full min-h-[300px] flex items-center justify-center bg-gray-950 rounded-lg overflow-hidden">
                  {!imageErrors[idx] ? (
                    <img
                      src={url}
                      alt={`Page ${idx + 1}`}
                      loading="lazy"
                      onError={() => handleImageError(idx)}
                      className="w-full h-auto object-contain transition-opacity duration-300"
                    />
                  ) : (
                    <div className="p-8 text-center text-xs text-brand-muted flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                      <p>Page {idx + 1} failed to load</p>
                      <button
                        onClick={() => handleRetryImage(idx)}
                        className="rounded-lg bg-brand-accent px-3 py-1 text-[11px] font-bold text-white shadow-glow"
                      >
                        Reload Page
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Single Page RTL / LTR Mode */
            <div className="flex flex-col items-center justify-center max-w-4xl w-full min-h-[75vh]">
              <div className="relative w-full max-h-[85vh] flex items-center justify-center overflow-hidden bg-gray-950 rounded-2xl p-2">
                {!imageErrors[currentPage - 1] ? (
                  <img
                    src={pagesData.pageUrls[currentPage - 1]}
                    alt={`Page ${currentPage}`}
                    onError={() => handleImageError(currentPage - 1)}
                    className="max-h-[80vh] w-auto object-contain"
                  />
                ) : (
                  <div className="p-12 text-center text-xs text-brand-muted flex flex-col items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                    <p>Page {currentPage} failed to load</p>
                    <button
                      onClick={() => handleRetryImage(currentPage - 1)}
                      className="rounded-lg bg-brand-accent px-3 py-1 text-[11px] font-bold text-white shadow-glow"
                    >
                      Reload Page
                    </button>
                  </div>
                )}
              </div>

              {/* Single Page Controls */}
              <div className="mt-4 flex items-center gap-4 text-xs font-bold">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, direction === 'rtl' ? p + 1 : p - 1))
                  }
                  disabled={direction === 'rtl' ? currentPage >= pagesData.pageUrls.length : currentPage <= 1}
                  className="rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-brand-accent"
                >
                  Prev Page
                </button>
                <span>
                  Page {currentPage} of {pagesData.pageUrls.length}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagesData.pageUrls.length, direction === 'rtl' ? p - 1 : p + 1)
                    )
                  }
                  disabled={direction === 'rtl' ? currentPage <= 1 : currentPage >= pagesData.pageUrls.length}
                  className="rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-brand-accent"
                >
                  Next Page
                </button>
              </div>
            </div>
          )
        ) : null}
      </main>

      {/* Bottom Navigation & Chapter Selector Bar */}
      {showControls && (
        <footer className="sticky bottom-0 z-50 flex items-center justify-between border-t border-brand-border/60 bg-brand-dark/95 px-4 py-3 backdrop-blur-md">
          {/* Prev Chapter */}
          <button
            onClick={handlePrevChapter}
            disabled={!hasPrevChapter}
            className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-brand-accent transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev Chapter</span>
          </button>

          {/* Chapter Selector Dropdown */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-accent hidden sm:inline" />
            <select
              value={currentChapterId}
              onChange={(e) => setCurrentChapterId(e.target.value)}
              className="rounded-xl border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-white focus:border-brand-accent focus:outline-none"
            >
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  Chapter {ch.chapterNumber} {ch.title ? `- ${ch.title}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Next Chapter */}
          <button
            onClick={handleNextChapter}
            disabled={!hasNextChapter}
            className="flex items-center gap-1 rounded-xl bg-brand-accent px-3 py-1.5 text-xs font-bold text-white shadow-glow disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent-hover transition-all"
          >
            <span className="hidden sm:inline">Next Chapter</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </footer>
      )}
    </div>
  );
}
