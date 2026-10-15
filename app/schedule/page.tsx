'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ChevronRight, AlertTriangle, Bell, BellOff, Check } from 'lucide-react';
import { getAiringSchedule, getAnimeTitle } from '@/lib/anilist';
import { isReminderSet, toggleReminder } from '@/lib/userPreferences';

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function loadSchedule() {
      setLoading(true);
      try {
        const data = await getAiringSchedule();
        setSchedule(data);

        // Check reminders for items in schedule
        const remMap: Record<number, boolean> = {};
        data.forEach((item) => {
          if (item.media) {
            remMap[item.media.id] = isReminderSet(item.media.id);
          }
        });
        setReminders(remMap);
      } catch (e) {
        console.error('Failed to load schedule:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, []);

  const handleToggleReminder = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const media = item.media;
    if (!media) return;

    const isSet = toggleReminder({
      animeId: media.id,
      animeTitle: getAnimeTitle(media),
      coverImage: media.coverImage?.large || '',
      nextAiringAt: item.airingAt,
      nextEpisode: item.episode,
      createdAt: Date.now(),
    });

    setReminders((prev) => ({ ...prev, [media.id]: isSet }));
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-brand-border/60 pb-6">
        <div className="flex items-center gap-2.5 text-brand-accent">
          <Calendar className="h-7 w-7" />
          <h1 className="text-2xl font-black text-white sm:text-3xl">Weekly Airing Schedule</h1>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-brand-muted">
          Upcoming anime episode releases for this week. Set local reminders for your favorite titles.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-accent border-t-transparent" />
        </div>
      ) : schedule.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {schedule.map((item) => {
            const media = item.media;
            if (!media) return null;
            const title = getAnimeTitle(media);
            const coverImage = media.coverImage?.large || media.coverImage?.medium || '';
            const airTime = new Date(item.airingAt * 1000).toLocaleString(undefined, {
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            const hasReminder = !!reminders[media.id];

            return (
              <div
                key={item.id}
                className="group relative flex overflow-hidden rounded-2xl border border-brand-border/60 bg-brand-surface p-3 transition-all hover:border-brand-accent/50 hover:shadow-lg"
              >
                {/* Anime Thumbnail */}
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-dark">
                  {coverImage && (
                    <Image
                      src={coverImage}
                      alt={title}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1 rounded bg-brand-accent px-1.5 py-0.5 text-[9px] font-extrabold text-white">
                    EP {item.episode}
                  </span>
                </div>

                {/* Details */}
                <div className="ml-3 flex flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <Link href={`/anime/${media.id}`}>
                        <h2 className="line-clamp-2 text-xs font-bold text-white group-hover:text-brand-accent transition-colors">
                          {title}
                        </h2>
                      </Link>

                      <button
                        onClick={(e) => handleToggleReminder(item, e)}
                        title={hasReminder ? 'Remove Reminder' : 'Set Release Reminder'}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all ${
                          hasReminder
                            ? 'border-brand-accent bg-brand-accent/20 text-brand-accent'
                            : 'border-brand-border bg-brand-dark text-brand-muted hover:text-white hover:border-brand-accent'
                        }`}
                      >
                        {hasReminder ? <Bell className="h-3.5 w-3.5 fill-brand-accent" /> : <BellOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-brand-muted">
                      <Clock className="h-3 w-3 text-brand-accent" />
                      <span>{airTime}</span>
                    </div>
                  </div>

                  <Link
                    href={`/anime/${media.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-accent hover:underline"
                  >
                    <span>View Anime</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[30vh] flex-col items-center justify-center text-center text-brand-muted">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-white">No Airing Schedule Available</p>
          <p className="text-xs mt-1">Check back later for updated release times.</p>
        </div>
      )}
    </div>
  );
}
