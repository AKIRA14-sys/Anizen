import Link from 'next/link';

export default function Footer() {
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
              A modern anime discovery platform powered by open metadata and accessible video providers.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/watchlist" className="hover:text-white transition-colors">Watchlist</Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-brand-muted md:text-right">
            <p>© {new Date().getFullYear()} ANIZEN. All rights reserved.</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Data provided by AniList & Aniweeb</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
