import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Star, Play, X, ExternalLink, BookmarkPlus, Heart, HeartHandshake } from 'lucide-react';
import { Header } from '@/components/Header';
import { MovieCard } from '@/components/MovieCard';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { tmdbApi } from '@/lib/tmdb';
import type { MovieDetail as MovieDetailType, TVDetail as TVDetailType } from '@/types/tmdb';
import { useAuth } from '@/hooks/useAuth';
import { addToWatchlist, addToFavourites, isInWatchlist, isInFavourites, removeFromWatchlist, removeFromFavourites } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

export default function MovieDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const movieId = parseInt(id || '0');
  const isTV = window.location.pathname.includes('/tv/');

  // Declare saved-state hooks BEFORE any early returns to keep hooks order stable
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavourites, setInFavourites] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user && movieId) {
        try {
          const [w, f] = await Promise.all([
            isInWatchlist(user.uid, movieId),
            isInFavourites(user.uid, movieId),
          ]);
          if (mounted) {
            setInWatchlist(w);
            setInFavourites(f);
          }
        } catch {
          if (mounted) {
            setInWatchlist(false);
            setInFavourites(false);
          }
        }
      } else {
        setInWatchlist(false);
        setInFavourites(false);
      }
    })();
    return () => { mounted = false };
  }, [user, movieId]);

  const { data: details, isLoading: detailsLoading } = useQuery<TVDetailType | MovieDetailType>({
    queryKey: isTV ? ['/tv', movieId] as (string | number)[] : ['/movie', movieId] as (string | number)[],
    queryFn: () => (isTV ? tmdbApi.getTVShowDetails(movieId) : tmdbApi.getMovieDetails(movieId)) as Promise<TVDetailType | MovieDetailType>,
    enabled: !!movieId,
  });

  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: isTV ? ['/tv', movieId, 'credits'] : ['/movie', movieId, 'credits'],
    queryFn: () => isTV ? tmdbApi.getTVShowCredits(movieId) : tmdbApi.getMovieCredits(movieId),
    enabled: !!movieId,
  });

  const { data: videos } = useQuery({
    queryKey: isTV ? ['/tv', movieId, 'videos'] : ['/movie', movieId, 'videos'],
    queryFn: () => isTV ? tmdbApi.getTVShowVideos(movieId) : tmdbApi.getMovieVideos(movieId),
    enabled: !!movieId,
  });

  const originCountry = isTV ? (details as TVDetailType | undefined)?.origin_country : undefined;
  const genresKey = details ? (details as any).genres : undefined;

  const { data: similar } = useQuery({
    queryKey: isTV
      ? (['/tv', movieId, 'similar', originCountry, genresKey] as const)
      : (['/movie', movieId, 'similar', undefined, genresKey] as const),
    queryFn: async () => {
      if (!details) return null;
      
      const tvOrigin = (details as TVDetailType | any).origin_country as string[] | undefined;
      const isRegional = tvOrigin?.includes('IN') || 
                        (details as any).original_language === 'hi' || 
                        (details as any).original_language === 'te' || 
                        (details as any).original_language === 'ta';
      
      const genreIds = details.genres?.map(g => g.id).join(',') || '';
      
      try {
        if (isRegional && genreIds) {
          // For regional content, get regional similar with same genres
          const regionalSimilar = isTV 
            ? await tmdbApi.getRegionalSimilarTVShows(movieId, 'IN', genreIds)
            : await tmdbApi.getRegionalSimilarMovies(movieId, 'IN', genreIds);
          
          if (regionalSimilar.results.length > 0) {
            return regionalSimilar;
          }
        }
        
        if (genreIds) {
          // Fallback to genre-based similar content
          return isTV 
            ? await tmdbApi.getGenreSimilarTVShows(movieId, genreIds)
            : await tmdbApi.getGenreSimilarMovies(movieId, genreIds);
        }
        
        // Final fallback to original similar endpoint
        return isTV ? await tmdbApi.getSimilarTVShows(movieId) : await tmdbApi.getSimilarMovies(movieId);
      } catch (error) {
        // Fallback to original similar endpoint on error
        return isTV ? await tmdbApi.getSimilarTVShows(movieId) : await tmdbApi.getSimilarMovies(movieId);
      }
    },
    enabled: !!movieId && !!details,
  });

  if (detailsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-8 w-32 mb-8" />
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Content Not Found</h1>
              <p className="text-muted-foreground mb-8">
                The {isTV ? 'TV show' : 'movie'} you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isTV ? (details as any).name : (details as any).title;
  const releaseDate = isTV ? (details as any).first_air_date : (details as any).release_date;
  const runtime = isTV ? (details as any).episode_run_time?.[0] : (details as any).runtime;
  
  const trailer = videos?.results.find(
    video => video.type === 'Trailer' && video.site === 'YouTube'
  );

  const director = credits?.crew.find(person => person.job === 'Director');
  const topCast = credits?.cast.slice(0, 6) || [];

  const handleSimilarClick = (itemId: number) => {
    navigate(isTV ? `/tv/${itemId}` : `/movie/${itemId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const mediaType: 'movie' | 'tv' = isTV ? 'tv' : 'movie';
  const savePayload = {
    tmdbId: movieId,
    title: title as string,
    posterPath: details.poster_path || null,
    mediaType,
  } as const;


  const handleSaveWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (inWatchlist) {
        // Remove from watchlist
        await removeFromWatchlist(user.uid, movieId);
        setInWatchlist(false);
        toast({ title: 'Removed from Watchlist' });
      } else {
        // Add to watchlist
        await addToWatchlist(user.uid, savePayload);
        setInWatchlist(true);
        toast({ title: 'Added to Watchlist!' });
      }
    } catch (e) {
      console.error('Failed to update watchlist', e);
      toast({ title: 'Something went wrong', variant: 'destructive' });
    }
  };

  const handleSaveFavourite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (inFavourites) {
        // Remove from favourites
        await removeFromFavourites(user.uid, movieId);
        setInFavourites(false);
        toast({ title: 'Removed from Favourites' });
      } else {
        // Add to favourites
        await addToFavourites(user.uid, savePayload);
        setInFavourites(true);
        toast({ title: 'Added to Favourites!' });
      }
    } catch (e) {
      console.error('Failed to update favourites', e);
      toast({ title: 'Something went wrong', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-8"
              onClick={() => navigate('/')}
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Poster */}
              <div className="lg:col-span-1">
                {details.poster_path ? (
                  <img
                    src={tmdbApi.getImageUrl(details.poster_path, 'w780')}
                    alt={title}
                    className="w-full rounded-lg shadow-xl"
                    data-testid="movie-poster"
                  />
                ) : (
                  <div className="aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">No Poster</span>
                  </div>
                )}
              </div>
              
              {/* Movie Information */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 
                    className="text-4xl font-display font-bold mb-4 gradient-text"
                    data-testid="movie-title"
                  >
                    {title}
                  </h1>
                  
                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                    {details.vote_average > 0 && (
                      <div className="flex items-center bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-600 fill-current mr-1" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                          {details.vote_average.toFixed(1)}/10
                        </span>
                      </div>
                    )}
                    
                    {releaseDate && (
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(releaseDate).getFullYear()}</span>
                      </div>
                    )}
                    
                    {runtime && (
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatRuntime(runtime)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Genres */}
                  {details.genres && details.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {details.genres.map((genre) => (
                        <Badge key={genre.id} variant="secondary">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={handleSaveWatchlist}
                      title={!user ? 'Login to save to Watchlist' : undefined}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] ${
                        inWatchlist 
                          ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 text-white' 
                          : 'bg-gradient-to-r from-blue-500/70 via-blue-600/70 to-cyan-600/70 text-white/90 hover:from-blue-500 hover:via-blue-600 hover:to-cyan-600'
                      }`}
                    >
                      <BookmarkPlus className={`w-4 h-4 transition-all ${inWatchlist ? 'fill-current' : ''}`} />
                      <span className="font-medium">{inWatchlist ? 'Saved to Watchlist' : 'Save to Watchlist'}</span>
                    </button>
                    <button
                      onClick={handleSaveFavourite}
                      title={!user ? 'Login to add to Favourites' : undefined}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] ${
                        inFavourites 
                          ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white' 
                          : 'bg-gradient-to-r from-pink-500/70 via-rose-500/70 to-red-500/70 text-white/90 hover:from-pink-500 hover:via-rose-500 hover:to-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-all ${inFavourites ? 'fill-current' : ''}`} />
                      <span className="font-medium">{inFavourites ? 'Added to Favourites' : 'Add to Favourites'}</span>
                    </button>
                  </div>
                </div>
                {/* Storyline */}
                {details.overview && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Storyline</h3>
                    <p className="text-muted-foreground leading-relaxed" data-testid="movie-overview">
                      {details.overview}
                    </p>
                  </div>
                )}
                
                {/* Box Office (Movies only) */}
                {!isTV && (details as any).budget && (details as any).revenue && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Box Office</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Budget</div>
                        <div className="text-lg font-semibold" data-testid="movie-budget">
                          {formatCurrency((details as any).budget)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="text-lg font-semibold" data-testid="movie-revenue">
                          {formatCurrency((details as any).revenue)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Trailer Section */}
            {trailer && (
              <div className="mt-12">
                <h3 className="text-2xl font-semibold mb-6">Trailer</h3>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-xl"
                    src={`https://www.youtube.com/embed/${trailer.key}`}
                    title={trailer.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Cast & Crew */}
            {!creditsLoading && (director || topCast.length > 0) && (
              <div className="mt-12">
                <h3 className="text-2xl font-semibold mb-6">Cast & Crew</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {director && (
                    <div 
                      className="text-center cursor-pointer group transition-transform hover:scale-105" 
                      data-testid="director-info"
                      onClick={() => navigate(`/person/${director.id}`)}
                    >
                      {director.profile_path ? (
                        <img
                          src={tmdbApi.getImageUrl(director.profile_path, 'w185')}
                          alt={director.name}
                          className="w-20 h-20 rounded-full mx-auto mb-2 object-cover ring-2 ring-transparent group-hover:ring-primary transition-all"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full mx-auto mb-2 bg-muted flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary transition-all">
                          <span className="text-xs text-muted-foreground">No Photo</span>
                        </div>
                      )}
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">{director.name}</div>
                      <div className="text-xs text-muted-foreground">Director</div>
                    </div>
                  )}
                  
                  {topCast.map((actor) => (
                    <div 
                      key={actor.id} 
                      className="text-center cursor-pointer group transition-transform hover:scale-105" 
                      data-testid={`cast-${actor.id}`}
                      onClick={() => navigate(`/person/${actor.id}`)}
                    >
                      {actor.profile_path ? (
                        <img
                          src={tmdbApi.getImageUrl(actor.profile_path, 'w185')}
                          alt={actor.name}
                          className="w-20 h-20 rounded-full mx-auto mb-2 object-cover ring-2 ring-transparent group-hover:ring-primary transition-all"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full mx-auto mb-2 bg-muted flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary transition-all">
                          <span className="text-xs text-muted-foreground">No Photo</span>
                        </div>
                      )}
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">{actor.name}</div>
                      <div className="text-xs text-muted-foreground truncate" title={actor.character}>
                        {actor.character}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* More Like This */}
            {similar && similar.results.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-semibold mb-6">More Like This</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {similar.results.slice(0, 6).map((item) => (
                    <MovieCard
                      key={item.id}
                      item={item}
                      type={isTV ? 'tv' : 'movie'}
                      onClick={() => handleSimilarClick(item.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
