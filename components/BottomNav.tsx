'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, BookOpen, Calendar, Bookmark } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Manga', href: '/manga', icon: BookOpen },
    { label: 'Schedule', href: '/schedule', icon: Calendar },
    { label: 'Watchlist', href: '/watchlist', icon: Bookmark },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-border/80 bg-brand-dark/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-[11px] font-bold transition-all ${
                isActive ? 'text-brand-accent' : 'text-brand-muted hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
