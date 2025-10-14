import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi } from '@/lib/tmdb';
import { Video } from '@/types/tmdb';

export function PopularTrailersSection() {
  const { data: trailersData, isLoading } = useQuery({
    queryKey: ['/popular/trailers'],
    queryFn: () => tmdbApi.getPopularTrailers(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const [playingTrailer, setPlayingTrailer] = useState<string | null>(null);

  const toggleTrailer = (videoKey: string) => {
    setPlayingTrailer(playingTrailer === videoKey ? null : videoKey);
  };

  const renderSkeleton = () => (
    <div className="flex space-x-6 overflow-x-auto pb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-none w-80 md:w-96">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <section className="py-16 bg-background" data-testid="popular-trailers-section">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
            Tranding Trailers
          </h2>
          {renderSkeleton()}
        </div>
      </section>
    );
  }

  const validTrailers = trailersData?.filter(({ trailers }) => 
    trailers.results.some(video => video.type === 'Trailer' && video.site === 'YouTube')
  ) || [];

  return (
    <section className="py-16 bg-background" data-testid="popular-trailers-section">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
          Tranding Trailers
        </h2>
        
        <div className="relative">
          <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide">
            {validTrailers.slice(0, 10).map(({ movie, trailers }) => {
              const trailer = trailers.results.find(
                video => video.type === 'Trailer' && video.site === 'YouTube'
              );
              
              if (!trailer) return null;
              
              return (
                <div 
                  key={movie.id} 
                  className="flex-none w-80 md:w-96"
                  data-testid={`trailer-${movie.id}`}
                >
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="relative aspect-video group cursor-pointer">
                      {playingTrailer === trailer.key ? (
                        <div className="relative w-full h-full">
                          <iframe
                            src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                            title={`${movie.title} trailer`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                          <button
                            onClick={() => setPlayingTrailer(null)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center transition-colors"
                            aria-label="Close trailer"
                            data-testid={`close-trailer-${movie.id}`}
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {movie.backdrop_path ? (
                            <img
                              src={tmdbApi.getBackdropUrl(movie.backdrop_path, 'w780')}
                              alt={`${movie.title} trailer`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">No Preview</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleTrailer(trailer.key)}
                              className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                              aria-label={`Play trailer for ${movie.title}`}
                              data-testid={`play-trailer-${movie.id}`}
                            >
                              <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h4 
                        className="font-semibold mb-2 line-clamp-2"
                        data-testid={`trailer-title-${movie.id}`}
                      >
                        {movie.title} - Official Trailer
                      </h4>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>★ {movie.vote_average.toFixed(1)}</span>
                        <span>{new Date(movie.release_date).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {validTrailers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No trailers available at the moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
