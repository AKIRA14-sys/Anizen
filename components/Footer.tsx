import Link from 'next/link';
import { Smartphone, Download } from 'lucide-react';

export default function Footer() {
  const apkDownloadUrl = 'https://github.com/AKIRA14-sys/Anizen/releases/latest/download/app-debug.apk';

  return (
    <footer className="mt-auto border-t border-brand-border/60 bg-brand-surface text-brand-muted">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand Info */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <Link href="/" className="text-xl font-black tracking-wider text-white">
              ANI<span className="text-brand-accent">ZEN</span>
            </Link>
            <p className="text-xs text-brand-muted max-w-xs text-center md:text-left">
              A modern anime & manga discovery platform powered by open metadata and accessible video providers.
            </p>
          </div>

          {/* Nav & Download Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/manga" className="hover:text-white transition-colors">Manga</Link>
            <Link href="/watchlist" className="hover:text-white transition-colors">Watchlist</Link>
            <a
              href={apkDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-brand-accent/40 bg-brand-accent/10 px-3 py-1.5 text-xs font-bold text-brand-accent hover:bg-brand-accent hover:text-white transition-all"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Android APK</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-brand-muted md:text-right">
            <p>© {new Date().getFullYear()} ANIZEN. All rights reserved.</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Data provided by AniList, MangaDex & Aniweeb</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
