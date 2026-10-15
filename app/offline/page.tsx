'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Bookmark } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-surface border border-brand-accent/40 text-brand-accent shadow-glow mb-6">
        <WifiOff className="h-10 w-10" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">You are Currently Offline</h1>
      <p className="text-xs sm:text-sm text-brand-muted mb-8 leading-relaxed">
        An active internet connection is required to discover new anime titles and stream video episodes. You can still access your saved local watchlist and viewing statistics.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        <button
          onClick={handleRetry}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-6 py-3 text-xs font-bold text-white shadow-glow hover:bg-brand-accent-hover transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>

        <Link
          href="/watchlist"
          className="flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-6 py-3 text-xs font-bold text-white hover:border-brand-accent transition-colors"
        >
          <Bookmark className="h-4 w-4 text-brand-accent" />
          <span>My Saved Watchlist</span>
        </Link>
      </div>
    </div>
  );
}
