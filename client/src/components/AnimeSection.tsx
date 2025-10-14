import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi } from '@/lib/tmdb';
import { AnimeCard } from '@/components/AnimeCard';

export function AnimeSection() {
  const [, navigate] = useLocation();
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day');

  const { data: trendingAnime, isLoading: trendingLoading } = useQuery({
    queryKey: ['/anime/trending', timeWindow],
    queryFn: () => tmdbApi.getTrendingAnime(timeWindow),
    staleTime: 10 * 60 * 1000,
  });

  const { data: popularAnime, isLoading: popularLoading } = useQuery({
    queryKey: ['/anime/popular'],
    queryFn: () => tmdbApi.getPopularAnime(),
    staleTime: 30 * 60 * 1000,
  });

  const handleAnimeClick = (tvId: number) => {
    navigate(`/tv/${tvId}`);
  };

  const renderSkeleton = (count = 12) => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-16 bg-background" data-testid="anime-section">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
          Anime
        </h2>

        {/* Trending Anime */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-display font-semibold">Trending Anime</h3>
            <div className="flex items-center space-x-2">
              {/* Mobile: dropdown */}
              <div className="sm:hidden">
                <select
                  className="px-3 py-2 bg-input border border-border rounded-lg"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value as 'day' | 'week')}
                  data-testid="anime-trending-time-select"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                </select>
              </div>
              {/* Desktop: buttons */}
              <div className="hidden sm:flex space-x-2">
                <Button
                  variant={timeWindow === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeWindow('day')}
                  data-testid="anime-trending-daily"
                >
                  Daily
                </Button>
                <Button
                  variant={timeWindow === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeWindow('week')}
                  data-testid="anime-trending-weekly"
                >
                  Weekly
                </Button>
              </div>
            </div>
          </div>

          {trendingLoading ? (
            renderSkeleton()
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {trendingAnime?.results.slice(0, 12).map((show) => (
                <AnimeCard key={show.id} item={show} onClick={() => handleAnimeClick(show.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Popular Anime */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-display font-semibold">Popular Anime</h3>
          </div>
          {popularLoading ? (
            renderSkeleton()
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {popularAnime?.results.slice(0, 12).map((show) => (
                <AnimeCard key={show.id} item={show} onClick={() => handleAnimeClick(show.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
