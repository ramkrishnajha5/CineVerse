
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { MovieCard } from './MovieCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi } from '@/lib/tmdb';

export function UpcomingMoviesSection() {
  const [, navigate] = useLocation();
  const [region, setRegion] = useState<'world' | 'india'>('world');

  const { data: upcomingMovies, isLoading } = useQuery({
    queryKey: ['/movie/upcoming', region],
    queryFn: () => tmdbApi.getUpcomingMovies(region === 'india' ? 'IN' : undefined),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`);
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

  return (
    <section className="py-16 bg-muted/50" data-testid="upcoming-movies-section">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-3">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Upcoming Movies
          </h2>
          
          {/* Toggles - below title on mobile, right side on desktop */}
          <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
            <Button
              variant={region === 'world' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRegion('world')}
              data-testid="upcoming-world-button"
              className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
            >
              World
            </Button>
            <Button
              variant={region === 'india' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRegion('india')}
              data-testid="upcoming-india-button"
              className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
            >
              India
            </Button>
          </div>
        </div>
        
        {isLoading ? renderSkeleton() : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {upcomingMovies?.results.slice(0, 12).map((movie) => (
              <MovieCard
                key={movie.id}
                item={movie}
                type="movie"
                onClick={() => handleMovieClick(movie.id)}
              />
            ))}
            {(!upcomingMovies?.results || upcomingMovies.results.length === 0) && !isLoading && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No upcoming movies found.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
