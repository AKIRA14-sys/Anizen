import HeroCarousel from '@/components/HeroCarousel';
import AppDownloadBanner from '@/components/AppDownloadBanner';
import ContinueWatchingRail from '@/components/ContinueWatchingRail';
import AnimeRail from '@/components/AnimeRail';
import GenreSection from '@/components/GenreSection';
import { AnimeMedia } from '@/types/anime';
import {
  getFeaturedAnime,
  getTrendingAnime,
  getSeasonalAnime,
  getTopRatedAnime,
  getHiddenGemsAnime,
} from '@/lib/anilist';

export const revalidate = 3600; // Revalidate page hourly

export default async function HomePage() {
  let featuredList: AnimeMedia[] = [];
  let trendingList: AnimeMedia[] = [];
  let seasonalList: AnimeMedia[] = [];
  let topRatedList: AnimeMedia[] = [];
  let hiddenGemsList: AnimeMedia[] = [];
  let errorOccurred = false;

  try {
    const [featured, trending, seasonal, topRated, hiddenGems] = await Promise.all([
      getFeaturedAnime(),
      getTrendingAnime(1, 12),
      getSeasonalAnime(1, 12),
      getTopRatedAnime(1, 12),
      getHiddenGemsAnime(1, 12),
    ]);

    featuredList = featured;
    trendingList = trending;
    seasonalList = seasonal;
    topRatedList = topRated;
    hiddenGemsList = hiddenGems;
  } catch (error) {
    console.error('Failed to load homepage data:', error);
    errorOccurred = true;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Featured Multi-Slide Hero Carousel */}
      {featuredList.length > 0 ? (
        <HeroCarousel items={featuredList} />
      ) : errorOccurred ? (
        <div className="mx-auto my-12 max-w-7xl px-4 text-center">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-8">
            <h2 className="text-xl font-bold text-white mb-2">Metadata Service Temporarily Unavailable</h2>
            <p className="text-sm text-brand-muted">
              We were unable to connect to the anime database. Please check back shortly or explore saved titles in your watchlist.
            </p>
          </div>
        </div>
      ) : null}

      {/* App Download Banner */}
      <AppDownloadBanner />

      {/* Continue Watching Rail */}
      <ContinueWatchingRail />

      {/* Discovery Sections */}
      <main className="flex-1 space-y-2 pb-12">
        <AnimeRail
          title="Trending Now"
          subtitle="The most talked-about anime this week"
          items={trendingList}
          viewAllHref="/explore?sort=TRENDING_DESC"
        />

        <AnimeRail
          title="New This Season"
          subtitle="Fresh episodes airing currently"
          items={seasonalList}
          viewAllHref="/explore?sort=POPULARITY_DESC"
        />

        {hiddenGemsList.length > 0 && (
          <AnimeRail
            title="Hidden Gems"
            subtitle="Critically acclaimed titles with moderate popularity"
            items={hiddenGemsList}
            viewAllHref="/explore?sort=SCORE_DESC"
          />
        )}

        <GenreSection />

        <AnimeRail
          title="Top Rated"
          subtitle="Highest acclaimed anime of all time"
          items={topRatedList}
          viewAllHref="/explore?sort=SCORE_DESC"
        />
      </main>
    </div>
  );
}
