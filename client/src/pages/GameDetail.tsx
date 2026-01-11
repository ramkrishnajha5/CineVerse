import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Star, ExternalLink, Gamepad2, Monitor, Building2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameCard } from '@/components/games/GameCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { gamesApi, EnrichedGameDetail } from '@/lib/games';

export default function GameDetail() {
    const { id } = useParams<{ id: string }>();
    const [, navigate] = useLocation();
    const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

    const gameId = parseInt(id || '0', 10);

    const { data: details, isLoading: detailsLoading } = useQuery<EnrichedGameDetail>({
        queryKey: ['game-detail', gameId],
        queryFn: () => gamesApi.getGameDetails(gameId),
        enabled: gameId > 0,
        staleTime: 7 * 24 * 60 * 60 * 1000,
    });

    // Loading state
    if (detailsLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="py-8">
                    <div className="container mx-auto px-4">
                        <Skeleton className="h-8 w-32 mb-8" />
                        {/* Hero skeleton */}
                        <Skeleton className="w-full h-[400px] rounded-xl mb-8" />
                        {/* Content skeleton */}
                        <div className="space-y-6">
                            <Skeleton className="h-12 w-2/3" />
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Not found state
    if (!details) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="text-center py-12">
                            <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
                            <p className="text-muted-foreground mb-8">
                                The game you're looking for doesn't exist or has been removed.
                            </p>
                            <Button onClick={() => navigate('/games')}>
                                Back to Games
                            </Button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const title = details.name;
    const releaseDate = details.released;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const rating = details.rating;
    const metacritic = details.metacritic;
    const playtime = details.playtime;
    const platforms = details.parent_platforms?.map(p => p.platform.name) || [];
    const trailer = details.movies?.[0];

    const handleSimilarClick = (itemId: number) => {
        navigate(`/games/${itemId}`);
    };

    const formatPlaytime = (hours: number) => {
        if (hours >= 100) return `${Math.round(hours)}+ hours`;
        return `~${Math.round(hours)} hours`;
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main>
                {/* Hero Section - Full Width with Background */}
                <section
                    className="relative w-full min-h-[60vh] flex items-end"
                    style={{
                        backgroundImage: details.background_image
                            ? `linear-gradient(to top, var(--background) 0%, transparent 50%, rgba(0,0,0,0.7) 100%), url(${details.background_image})`
                            : 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #0f0f1a 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top',
                    }}
                >
                    {/* Back Button - Top Left with Blue Border */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-4 left-4 text-white bg-black/30 backdrop-blur-sm border border-blue-500 hover:bg-blue-500/20 hover:border-blue-400"
                        onClick={() => navigate('/games')}
                        data-testid="back-button"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                    </Button>

                    <div className="container mx-auto px-4 pb-8 pt-24">

                        {/* Title with Gradient - same as movie title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 drop-shadow-lg" data-testid="game-title">
                            <span className="hero-gradient-text">{title}</span>
                        </h1>

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            {rating > 0 && (
                                <div className="flex items-center bg-yellow-500/90 px-3 py-1.5 rounded-full">
                                    <Star className="w-4 h-4 text-yellow-900 fill-current mr-1" />
                                    <span className="font-bold text-yellow-900">{rating.toFixed(1)}/5</span>
                                </div>
                            )}

                            {metacritic && (
                                <div className={`flex items-center px-3 py-1.5 rounded-full font-bold ${metacritic >= 75 ? 'bg-green-500 text-green-900' :
                                    metacritic >= 50 ? 'bg-yellow-500 text-yellow-900' :
                                        'bg-red-500 text-red-900'
                                    }`}>
                                    Metacritic: {metacritic}
                                </div>
                            )}

                            {releaseYear && (
                                <div className="flex items-center bg-gray-800/80 text-white px-3 py-1.5 rounded-full backdrop-blur">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>{releaseYear}</span>
                                </div>
                            )}

                            {playtime > 0 && (
                                <div className="flex items-center bg-gray-800/80 text-white px-3 py-1.5 rounded-full backdrop-blur">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{formatPlaytime(playtime)}</span>
                                </div>
                            )}
                        </div>

                        {/* Platforms */}
                        {platforms.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {platforms.map((platform, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-gray-800/80 text-white backdrop-blur border-0">
                                        <Monitor className="w-3 h-3 mr-1" />
                                        {platform}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Main Content - FULL WIDTH LAYOUT */}
                <div className="container mx-auto px-4 py-12">

                    {/* About the Game - Full Width */}
                    {details.description_raw && (
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">About the Game</h2>
                            <div className="prose prose-lg dark:prose-invert max-w-none">
                                <p className="text-muted-foreground leading-relaxed text-lg" data-testid="game-overview">
                                    {details.description_raw}
                                </p>
                            </div>
                        </section>
                    )}

                    {/* Genres, Developers, Publishers - Full Width Grid */}
                    <section className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Genres */}
                        {details.genres && details.genres.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Genres</h3>
                                <div className="flex flex-wrap gap-2">
                                    {details.genres.map((genre) => (
                                        <Badge key={genre.id} variant="secondary">{genre.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Developers */}
                        {details.developers && details.developers.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Developers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {details.developers.map((dev) => (
                                        <Badge key={dev.id} variant="outline">
                                            <Building2 className="w-3 h-3 mr-1" />
                                            {dev.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Publishers */}
                        {details.publishers && details.publishers.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Publishers</h3>
                                <div className="flex flex-wrap gap-2">
                                    {details.publishers.map((pub) => (
                                        <Badge key={pub.id} variant="outline">{pub.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ESRB Rating */}
                        {details.esrb_rating && (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Age Rating</h3>
                                <Badge variant="secondary" className="text-base px-3 py-1">
                                    {details.esrb_rating.name}
                                </Badge>
                            </div>
                        )}
                    </section>

                    {/* Screenshots Gallery - Full Width */}
                    {details.screenshots && details.screenshots.length > 0 && (
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">Screenshots</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {details.screenshots.slice(0, 8).map((screenshot) => (
                                    <button
                                        key={screenshot.id}
                                        onClick={() => setSelectedScreenshot(screenshot.image)}
                                        className="relative aspect-video rounded-lg overflow-hidden group"
                                    >
                                        <img
                                            src={screenshot.image}
                                            alt={`Screenshot ${screenshot.id}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 text-white font-medium transition-opacity">
                                                View
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trailer Section - Full Width */}
                    {trailer && (
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">Trailer</h2>
                            <div className="relative w-full max-w-4xl mx-auto" style={{ paddingBottom: '56.25%' }}>
                                <video
                                    className="absolute top-0 left-0 w-full h-full rounded-xl shadow-xl"
                                    poster={trailer.preview}
                                    controls
                                >
                                    <source src={trailer.data.max || trailer.data['480']} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </section>
                    )}

                    {/* Store Links - Full Width */}
                    {details.storeLinks && details.storeLinks.length > 0 && (
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">Where to Buy</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {details.storeLinks.map((store, index) => (
                                    <a
                                        key={index}
                                        href={store.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:border-primary transition-all group"
                                    >
                                        <div>
                                            <div className="font-medium capitalize">{store.store_name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {store.price.discount_percent > 0 ? (
                                                    <>
                                                        <span className="line-through mr-2">${store.price.initial}</span>
                                                        <span className="text-green-500 font-semibold">${store.price.value}</span>
                                                        <span className="ml-2 text-green-500">-{store.price.discount_percent}%</span>
                                                    </>
                                                ) : (
                                                    <span>${store.price.value}</span>
                                                )}
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* RAWG Store Links as fallback */}
                    {(!details.storeLinks || details.storeLinks.length === 0) && details.stores && details.stores.length > 0 && (
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">Available On</h2>
                            <div className="flex flex-wrap gap-3">
                                {details.stores.map((storeWrapper) => (
                                    <Badge key={storeWrapper.id} variant="outline" className="px-4 py-2 text-base">
                                        {storeWrapper.store.name}
                                    </Badge>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Similar Games - Horizontal Carousel like Movies */}
                    {details.similarGames && details.similarGames.length > 0 && (
                        <section className="mb-12">
                            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">More Like This</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {details.similarGames.slice(0, 12).map((game) => (
                                    <GameCard
                                        key={game.id}
                                        game={game}
                                        onClick={() => handleSimilarClick(game.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Screenshot Modal */}
            {selectedScreenshot && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setSelectedScreenshot(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl z-10"
                        onClick={() => setSelectedScreenshot(null)}
                    >
                        ✕
                    </button>
                    <img
                        src={selectedScreenshot}
                        alt="Screenshot"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                    />
                </div>
            )}

            <Footer />
        </div>
    );
}
