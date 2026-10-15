'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { MangaMedia, MangaChapter } from '@/types/manga';
import { getMangaById } from '@/lib/manga';
import MangaReader from '@/components/MangaReader';

interface MangaReadPageProps {
  params: { id: string };
}

function MangaReadContent({ params }: MangaReadPageProps) {
  const searchParams = useSearchParams();
  const mangaId = parseInt(params.id, 10);
  const chapterId = searchParams.get('chapterId') || '';

  const [manga, setManga] = useState<MangaMedia | null>(null);
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(mangaId)) return;

    async function loadData() {
      setLoading(true);
      try {
        const media = await getMangaById(mangaId);
        setManga(media);

        if (media) {
          const titleToSearch = media.title.english || media.title.romaji || 'Manga';
          const res = await fetch(`/api/mangadex/chapters?title=${encodeURIComponent(titleToSearch)}`);
          const json = await res.json();
          if (res.ok && json.success) {
            setChapters(json.chapters || []);
          }
        }
      } catch (e) {
        console.error('Failed to load read data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [mangaId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-brand-muted">
        <Loader2 className="h-10 w-10 animate-spin text-brand-accent mb-2" />
        <p className="text-xs">Preparing manga reader...</p>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <h1 className="text-xl font-bold">Manga Not Found</h1>
        <Link
          href="/manga"
          className="mt-4 flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Manga Catalog
        </Link>
      </div>
    );
  }

  const selectedChapterId = chapterId || (chapters.length > 0 ? chapters[0].id : '');

  return <MangaReader manga={manga} chapters={chapters} initialChapterId={selectedChapterId} />;
}

export default function MangaReadPage({ params }: MangaReadPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-brand-muted">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      }
    >
      <MangaReadContent params={params} />
    </Suspense>
  );
}
