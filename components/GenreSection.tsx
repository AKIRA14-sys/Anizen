import Link from 'next/link';
import { Compass } from 'lucide-react';

const GENRES = [
  { name: 'Action', color: 'from-orange-600 to-red-600' },
  { name: 'Adventure', color: 'from-amber-500 to-orange-600' },
  { name: 'Comedy', color: 'from-yellow-500 to-amber-600' },
  { name: 'Drama', color: 'from-purple-600 to-indigo-600' },
  { name: 'Fantasy', color: 'from-blue-600 to-cyan-600' },
  { name: 'Romance', color: 'from-pink-600 to-rose-600' },
  { name: 'Sci-Fi', color: 'from-emerald-600 to-teal-600' },
  { name: 'Supernatural', color: 'from-violet-600 to-purple-800' },
];

export default function GenreSection() {
  return (
    <section className="py-6 sm:py-8 bg-brand-surface/40 border-y border-brand-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-brand-accent inline-block" />
            Explore Genres
          </h2>
          <Link
            href="/explore"
            className="flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline sm:text-sm"
          >
            <Compass className="h-4 w-4" />
            <span>All Genres</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {GENRES.map((g) => (
            <Link
              key={g.name}
              href={`/explore?genre=${encodeURIComponent(g.name)}`}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${g.color} p-3.5 text-center shadow-md transition-all duration-300 hover:scale-105 hover:shadow-glow-sm`}
            >
              <span className="relative z-10 text-xs font-bold text-white tracking-wide drop-shadow">
                {g.name}
              </span>
              <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-10" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
