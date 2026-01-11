import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameCard } from '@/components/games/GameCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { gamesApi } from '@/lib/games';
import heroImage from '@assets/GameVerseMain.jpg';

export default function Games() {
    const [, navigate] = useLocation();

    // Typewriter effect - same as CineVerse HeroSection
    const fullText = useMemo(() => 'Welcome to GameVerse', []);
    const [display, setDisplay] = useState('');
    const indexRef = useRef(0);
    const deletingRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const typeSpeed = 100;
        const deleteSpeed = 40;
        const pauseAfterComplete = 5000;

        const tick = () => {
            const i = indexRef.current;
            const deleting = deletingRef.current;

            if (!deleting) {
                const next = Math.min(i + 1, fullText.length);
                indexRef.current = next;
                setDisplay(fullText.slice(0, next));
                if (next === fullText.length) {
                    timerRef.current = window.setTimeout(() => {
                        deletingRef.current = true;
                        timerRef.current = window.setTimeout(tick, deleteSpeed);
                    }, pauseAfterComplete);
                } else {
                    timerRef.current = window.setTimeout(tick, typeSpeed);
                }
            } else {
                const next = Math.max(i - 1, 0);
                indexRef.current = next;
                setDisplay(fullText.slice(0, next));
                if (next === 0) {
                    deletingRef.current = false;
                    timerRef.current = window.setTimeout(tick, typeSpeed);
                } else {
                    timerRef.current = window.setTimeout(tick, deleteSpeed);
                }
            }
        };

        timerRef.current = window.setTimeout(tick, typeSpeed);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [fullText]);

    const { data: homeData, isLoading, error, refetch } = useQuery({
        queryKey: ['games-home'],
        queryFn: () => gamesApi.getHomeData(),
        staleTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const handleGameClick = (gameId: number) => {
        navigate(`/games/${gameId}`);
    };

    // Skeleton loader - same as TrendingSection
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

    // Error state
    const renderError = () => (
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

    // Section component - reusable for each category (no toggles)
    const renderSection = (title: string, games?: any[]) => {
        if (!games || games.length === 0) return null;

        return (
            <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-display font-semibold">{title}</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {games.slice(0, 12).map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            onClick={() => handleGameClick(game.id)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main>
                {/* Hero Section - Same styling as CineVerse with background image */}
                <section
                    className="relative min-h-[60vh] flex items-center justify-center hero-bg"
                    style={{ backgroundImage: `url(${heroImage})` }}
                    data-testid="games-hero-section"
                >
                    {/* Background overlay for text readability */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

                    <div className="relative z-10 text-center px-4 w-full flex flex-col items-center justify-center">
                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-6 whitespace-nowrap w-full overflow-visible">
                            <span className="hero-gradient-text" data-testid="games-hero-title">
                                {display}
                                <span className="inline-block w-[1ch] ml-1 align-baseline animate-pulse">|</span>
                            </span>
                        </h1>
                        <p
                            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
                            data-testid="games-hero-description"
                        >
                            Discover trending games, top-rated titles, and new releases across all platforms
                        </p>
                    </div>
                </section>

                {/* Games Sections */}
                <section className="py-16 bg-background" data-testid="games-section">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">
                            Explore Games
                        </h2>

                        {error ? (
                            renderError()
                        ) : isLoading ? (
                            <>
                                <div className="mb-16">
                                    <h3 className="text-2xl font-display font-semibold mb-8">Popular Games</h3>
                                    {renderSkeleton()}
                                </div>
                                <div className="mb-16">
                                    <h3 className="text-2xl font-display font-semibold mb-8">Top Rated</h3>
                                    {renderSkeleton()}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Popular Games (All Time - no toggle) */}
                                {renderSection('Popular Games', homeData?.popular)}

                                {/* Top Rated Games */}
                                {renderSection('Top Rated Games', homeData?.topRated)}

                                {/* New Releases - Last 90 Days */}
                                {renderSection('New Releases', homeData?.newReleases)}

                                {/* Action Games */}
                                {renderSection('Action Games', homeData?.action)}

                                {/* RPG Games */}
                                {renderSection('RPG Games', homeData?.rpg)}

                                {/* Adventure Games */}
                                {renderSection('Adventure Games', homeData?.adventure)}
                            </>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
