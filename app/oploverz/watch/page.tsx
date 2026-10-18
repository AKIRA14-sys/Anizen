'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import {
  getOploverzEpisode,
  slugFromHref,
  OploverzEpisodeDetails,
} from '@/lib/oploverz';

function WatchContent() {
  const searchParams = useSearchParams();
  const ep = searchParams.get('ep') || '';

  const [episode, setEpisode] = useState<OploverzEpisodeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ep) {
      setError('No episode selected.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setEpisode(null);

    getOploverzEpisode(ep)
      .then((data) => {
        if (!cancelled) setEpisode(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || 'Could not load this episode.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ep]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link href="/oploverz" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Oploverz
      </Link>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {episode && (
        <>
          <h1 className="text-lg font-black text-white sm:text-2xl">{episode.seriesName || episode.title}</h1>
          <p className="mb-4 text-xs text-brand-muted">
            {episode.title}
            {episode.releasedOn ? ` · ${episode.releasedOn}` : ''}
          </p>

          {episode.streamingUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-brand-border bg-black">
              <iframe
                src={episode.streamingUrl}
                title={episode.title}
                allowFullScreen
                referrerPolicy="no-referrer"
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-6 text-sm text-brand-muted">
              No player link was found for this episode.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {episode.prevEpisode && slugFromHref(episode.prevEpisode.href) && (
              <Link
                href={`/oploverz/watch?ep=${encodeURIComponent(slugFromHref(episode.prevEpisode.href))}`}
                className="rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-white hover:border-brand-accent"
              >
                Previous episode
              </Link>
            )}
          </div>

          {episode.download.length > 0 && (
            <section className="mt-8 rounded-2xl border border-brand-border bg-brand-surface p-4 sm:p-6">
              <h2 className="mb-3 text-sm font-bold text-white">Downloads</h2>
              <div className="space-y-4">
                {episode.download.map((format, i) => (
                  <div key={`${format.title}-${i}`}>
                    <p className="text-xs font-bold text-brand-muted">{format.title}</p>
                    <div className="mt-2 space-y-2">
                      {format.qualityList.map((quality, j) => (
                        <div key={`${quality.title}-${j}`} className="flex flex-wrap items-center gap-2">
                          <span className="w-16 text-xs text-white">{quality.title}</span>
                          {quality.urlList.map((link, k) => (
                            <a
                              key={`${link.url}-${k}`}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-brand-border bg-brand-dark px-2.5 py-1 text-[11px] font-semibold text-white hover:border-brand-accent"
                            >
                              {link.title || 'Link'}
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      }
    >
      <WatchContent />
    </Suspense>
  );
}