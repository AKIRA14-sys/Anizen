'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bookmark, Compass, Home, Menu, X, Play, Calendar, BarChart2, Dices } from 'lucide-react';
import { getRandomAnime } from '@/lib/anilist';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSurprising, setIsSurprising] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleSurpriseMe = async () => {
    setIsSurprising(true);
    try {
      const randomItem = await getRandomAnime();
      if (randomItem) {
        router.push(`/anime/${randomItem.id}`);
        setMobileMenuOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSurprising(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
    { name: 'Stats', href: '/stats', icon: BarChart2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border/60 bg-brand-dark/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-accent to-amber-500 text-white shadow-glow-sm transition-transform group-hover:scale-105">
            <Play className="h-5 w-5 fill-white text-white ml-0.5" />
          </div>
          <span className="text-xl font-black tracking-wider text-white">
            ANI<span className="text-brand-accent">ZEN</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-accent/15 text-brand-accent font-bold'
                    : 'text-brand-muted hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Search & Surprise Me */}
        <div className="hidden md:flex md:items-center gap-2.5">
          <button
            onClick={handleSurpriseMe}
            disabled={isSurprising}
            title="Random Anime Discovery"
            className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-accent hover:border-brand-accent hover:bg-brand-accent/10 transition-all"
          >
            <Dices className={`h-4 w-4 ${isSurprising ? 'animate-spin' : ''}`} />
            <span>Surprise Me</span>
          </button>

          <form onSubmit={handleSearchSubmit} className="relative w-48 lg:w-56">
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-brand-border bg-brand-surface py-1.5 pl-9 pr-4 text-xs text-white placeholder-brand-muted transition-colors focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-brand-muted" />
          </form>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={handleSurpriseMe}
            disabled={isSurprising}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-accent hover:bg-brand-accent/10"
            aria-label="Surprise Me"
          >
            <Dices className={`h-4 w-4 ${isSurprising ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/explore"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:text-white"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-brand-border bg-brand-dark px-4 pb-5 pt-3 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4 relative">
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-brand-surface py-2 pl-9 pr-4 text-sm text-white placeholder-brand-muted focus:border-brand-accent focus:outline-none"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-brand-muted" />
          </form>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                      : 'text-brand-muted hover:bg-brand-surface hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
