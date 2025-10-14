import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { MovieCard } from './MovieCard';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi } from '@/lib/tmdb';

export function PopularMoviesByRegion() {
  const [, navigate] = useLocation();

  const { data: hollywoodMovies, isLoading: hollywoodLoading } = useQuery({
    queryKey: ['/discover/movie', 'US'],
    queryFn: () => tmdbApi.getPopularMoviesByOrigin('US'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Anime Movies (Popular Anime)
  const { data: animeMovies, isLoading: animeLoading } = useQuery({
    queryKey: ['/discover/movie', 'anime-ja'],
    queryFn: () => tmdbApi.getPopularAnimeMovies(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: bollywoodMovies, isLoading: bollywoodLoading } = useQuery({
    queryKey: ['/discover/movie', 'IN'],
    queryFn: () => tmdbApi.getPopularMoviesByOrigin('IN'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // For Tollywood, we'll use IN origin and filter for Telugu/Tamil if possible
  const { data: tollywoodMovies, isLoading: tollywoodLoading } = useQuery({
    queryKey: ['/discover/movie', 'IN', 'regional'],
    queryFn: () => tmdbApi.getPopularMoviesByOrigin('IN'),
    staleTime: 30 * 60 * 1000, // 30 minutes
    select: (data) => ({
      ...data,
      results: data.results.filter(movie => 
        movie.original_language === 'te' || movie.original_language === 'ta'
      )
    }),
  });

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`);
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  const regions = [
    {
      title: 'Hollywood Movies',
      data: hollywoodMovies,
      isLoading: hollywoodLoading,
      gradient: 'from-pink-500 to-blue-500',
      testId: 'hollywood-section'
    },
    {
      title: 'Bollywood Movies',
      data: bollywoodMovies,
      isLoading: bollywoodLoading,
      gradient: 'from-orange-500 to-green-500',
      testId: 'bollywood-section'
    },
    {
      title: 'Tollywood Movies',
      data: tollywoodMovies,
      isLoading: tollywoodLoading,
      gradient: 'from-blue-500 to-purple-500',
      testId: 'tollywood-section'
    },
    {
      title: 'Anime Movies',
      data: animeMovies,
      isLoading: animeLoading,
      gradient: 'from-purple-500 to-pink-500',
      testId: 'anime-movies-section'
    }
  ];

  return (
    <section className="py-16 bg-muted/50" data-testid="popular-movies-by-region">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
          Popular Movies by Category
        </h2>
        
        {regions.map((region, index) => (
          <div key={region.title} className={index < regions.length - 1 ? 'mb-16' : ''}>
            <h3 
              className="text-2xl font-display font-semibold mb-8 flex items-center"
              data-testid={`${region.testId}-title`}
            >
              <span className={`w-1 h-8 bg-gradient-to-b ${region.gradient} mr-3`}></span>
              {region.title}
            </h3>
            
            {region.isLoading ? renderSkeleton() : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {region.data?.results.slice(0, 6).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    item={movie}
                    type="movie"
                    onClick={() => handleMovieClick(movie.id)}
                  />
                ))}
                {(!region.data?.results || region.data.results.length === 0) && !region.isLoading && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No movies found for this region.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
