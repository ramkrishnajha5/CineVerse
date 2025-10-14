import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { MovieCard } from './MovieCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi } from '@/lib/tmdb';

export function TrendingSection() {
  const [, navigate] = useLocation();
  const [movieTimeWindow, setMovieTimeWindow] = useState<'day' | 'week'>('day');
  const [tvTimeWindow, setTvTimeWindow] = useState<'day' | 'week'>('day');
  const [animeTimeWindow, setAnimeTimeWindow] = useState<'day' | 'week'>('day');
  const [movieRegion, setMovieRegion] = useState<'world' | 'india'>('world');
  const [tvRegion, setTvRegion] = useState<'world' | 'india'>('world');

  const { data: trendingMovies, isLoading: moviesLoading, error: moviesError, refetch: refetchMovies } = useQuery({
    queryKey: ['/trending/movie', movieTimeWindow, movieRegion],
    queryFn: async () => {
      if (movieRegion === 'india') {
        return tmdbApi.getPopularMoviesByOrigin('IN');
      }
      return tmdbApi.getTrendingMovies(movieTimeWindow);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: trendingAnime, isLoading: animeLoading, error: animeError, refetch: refetchAnime } = useQuery({
    queryKey: ['/trending/anime', animeTimeWindow],
    queryFn: () => tmdbApi.getTrendingAnime(animeTimeWindow),
    staleTime: 10 * 60 * 1000,
  });

  const { data: trendingTvShows, isLoading: tvLoading, error: tvError, refetch: refetchTv } = useQuery({
    queryKey: ['/trending/tv', tvTimeWindow, tvRegion],
    queryFn: async () => {
      if (tvRegion === 'india') {
        return tmdbApi.getPopularTVShowsByOrigin('IN');
      }
      return tmdbApi.getTrendingTVShows(tvTimeWindow);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`);
  };

  const handleTvClick = (tvId: number) => {
    navigate(`/tv/${tvId}`);
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  const renderError = (error: any, refetch: () => void) => (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        <p className="text-destructive mb-4">⚠️ Failed to load content</p>
        <p className="text-sm text-muted-foreground mb-6">
          {error?.message || 'Network error. Please check your connection.'}
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    </div>
  );

  return (
    <section className="py-16 bg-background" data-testid="trending-section">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
          Trending Now
        </h2>
        
        {/* Trending Movies */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3">
            <h3 className="text-2xl font-display font-semibold">Trending Movies</h3>
            
            {/* Toggles - below title on mobile, right side on desktop */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                variant={movieRegion === 'world' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMovieRegion('world')}
                data-testid="movies-world-button"
                className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
              >
                World
              </Button>
              <Button
                variant={movieRegion === 'india' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMovieRegion('india')}
                data-testid="movies-india-button"
                className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
              >
                India
              </Button>
              
              {/* Time Window Toggle - only shown for World */}
              {movieRegion === 'world' && (
                <>
                  <Button
                    variant={movieTimeWindow === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMovieTimeWindow('day')}
                    data-testid="movies-daily-button"
                    className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
                  >
                    Daily
                  </Button>
                  <Button
                    variant={movieTimeWindow === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMovieTimeWindow('week')}
                    data-testid="movies-weekly-button"
                    className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
                  >
                    Weekly
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {moviesError ? renderError(moviesError, refetchMovies) : moviesLoading ? renderSkeleton() : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {trendingMovies?.results.slice(0, 12).map((movie) => (
                <MovieCard
                  key={movie.id}
                  item={movie}
                  type="movie"
                  onClick={() => handleMovieClick(movie.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Trending TV Shows */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3">
            <h3 className="text-2xl font-display font-semibold">Trending TV Shows & Web Series</h3>
            
            {/* Toggles - below title on mobile, right side on desktop */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                variant={tvRegion === 'world' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTvRegion('world')}
                data-testid="tv-world-button"
                className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
              >
                World
              </Button>
              <Button
                variant={tvRegion === 'india' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTvRegion('india')}
                data-testid="tv-india-button"
                className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
              >
                India
              </Button>
              
              {/* Time Window Toggle - only shown for World */}
              {tvRegion === 'world' && (
                <>
                  <Button
                    variant={tvTimeWindow === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTvTimeWindow('day')}
                    data-testid="tv-daily-button"
                    className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
                  >
                    Daily
                  </Button>
                  <Button
                    variant={tvTimeWindow === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTvTimeWindow('week')}
                    data-testid="tv-weekly-button"
                    className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
                  >
                    Weekly
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {tvError ? renderError(tvError, refetchTv) : tvLoading ? renderSkeleton() : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {trendingTvShows?.results.slice(0, 12).map((show) => (
                <MovieCard
                  key={show.id}
                  item={show}
                  type="tv"
                  onClick={() => handleTvClick(show.id)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Trending Anime */}
        <div className="mt-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3">
            <h3 className="text-2xl font-display font-semibold">Trending Anime</h3>
            
            {/* Toggles - below title on mobile, right side on desktop */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button
                variant={animeTimeWindow === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnimeTimeWindow('day')}
                data-testid="anime-daily-button"
                className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
              >
                Daily
              </Button>
              <Button
                variant={animeTimeWindow === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnimeTimeWindow('week')}
                data-testid="anime-weekly-button"
                className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
              >
                Weekly
              </Button>
            </div>
          </div>

          {animeError ? renderError(animeError, refetchAnime) : animeLoading ? renderSkeleton() : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {trendingAnime?.results.slice(0, 12).map((show) => (
                <MovieCard
                  key={show.id}
                  item={show}
                  type="tv"
                  onClick={() => handleTvClick(show.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
