import type { Express, Request, Response } from 'express';

// API Configuration - keys from environment variables
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const GAMEBRAIN_API_KEY = process.env.GAMEBRAIN_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';
const GAMEBRAIN_BASE_URL = 'https://api.apileague.com';

// Validate API keys on startup
if (!RAWG_API_KEY) {
    console.warn('[Games API] Warning: RAWG_API_KEY not set. Games section will not work.');
}
if (!GAMEBRAIN_API_KEY) {
    console.warn('[Games API] Warning: GAMEBRAIN_API_KEY not set. Store links may be limited.');
}

// Simple in-memory cache
interface CacheEntry {
    data: any;
    timestamp: number;
    ttl: number;
}

const cache = new Map<string, CacheEntry>();

// Cache durations in milliseconds
const CACHE_24H = 24 * 60 * 60 * 1000;
const CACHE_7D = 7 * 24 * 60 * 60 * 1000;
const CACHE_1H = 60 * 60 * 1000;

function getCached(key: string): any | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
        cache.delete(key);
        return null;
    }

    return entry.data;
}

function setCache(key: string, data: any, ttl: number): void {
    cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
    });
}

// RAWG API fetch helper
async function rawgFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!RAWG_API_KEY) {
        throw new Error('RAWG API key not configured');
    }

    const url = new URL(`${RAWG_BASE_URL}${endpoint}`);
    url.searchParams.set('key', RAWG_API_KEY);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    console.log('[RAWG] Fetching:', endpoint, params);

    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[RAWG] API error:', response.status, errorText);
        throw new Error(`RAWG API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// GameBrain API fetch helper
async function gamebrainFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!GAMEBRAIN_API_KEY) {
        return null;
    }

    const url = new URL(`${GAMEBRAIN_BASE_URL}${endpoint}`);
    url.searchParams.set('api-key', GAMEBRAIN_API_KEY);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    try {
        const response = await fetch(url.toString());
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
}

// ============================================================
// DATA VALIDATION & FILTERING UTILITIES
// ============================================================

function validateGame(game: any): boolean {
    if (!game || !game.id || !game.name) return false;
    if (!game.background_image) return false;

    const lowerName = game.name.toLowerCase();
    const excludePatterns = [
        'dlc', 'expansion', 'pack', 'addon', 'add-on',
        'season pass', 'demo', 'beta', 'alpha', 'prototype',
        'soundtrack', 'ost', 'art book', 'artbook'
    ];

    for (const pattern of excludePatterns) {
        if (lowerName.includes(pattern)) return false;
    }

    return true;
}

function sortByPopularity(games: any[]): any[] {
    return [...games].sort((a, b) => (b.added || 0) - (a.added || 0));
}

function sortByRatingThenPopularity(games: any[]): any[] {
    return [...games].sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.added || 0) - (a.added || 0);
    });
}

function sortByReleaseDate(games: any[]): any[] {
    return [...games].sort((a, b) => {
        const dateA = a.released ? new Date(a.released).getTime() : 0;
        const dateB = b.released ? new Date(b.released).getTime() : 0;
        return dateB - dateA;
    });
}

function getDateXDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}

function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

// Platform IDs for RAWG API
const PLATFORMS = {
    // PC/Desktop
    PC: '4',
    MAC: '5',
    LINUX: '6',
    DESKTOP_ALL: '4,5,6',

    // Consoles
    PS5: '187',
    PS4: '18',
    PS3: '16',
    XBOX_SERIES: '186',
    XBOX_ONE: '1',
    XBOX_360: '14',
    NINTENDO_SWITCH: '7',
    CONSOLE_ALL: '187,18,186,1,7',

    // Mobile
    IOS: '3',
    ANDROID: '21',
    MOBILE_ALL: '3,21',

    // All major platforms
    ALL_MAJOR: '4,5,187,18,186,1,7,3,21',
};

// Genre IDs
const GENRE_IDS = {
    action: 4,
    adventure: 3,
    rpg: 5,
    shooter: 2,
    strategy: 10,
    puzzle: 7,
    racing: 1,
    sports: 15,
};

export function registerGamesRoutes(app: Express): void {

    // ============================================================
    // GET /api/games/home - Homepage data with 24h cache
    // ============================================================
    app.get('/api/games/home', async (_req: Request, res: Response) => {
        try {
            const cacheKey = 'games_home_v3';
            const cached = getCached(cacheKey);

            if (cached) {
                console.log('[Games] Serving cached homepage data');
                return res.json(cached);
            }

            console.log('[Games] Fetching fresh homepage data');

            const today = getTodayDate();
            const ninetyDaysAgo = getDateXDaysAgo(90);

            // ============================================================
            // POPULAR GAMES (ALL PLATFORMS) - PC, Console, Mobile
            // ============================================================
            const popularData = await rawgFetch('/games', {
                ordering: '-added',
                page_size: '40',
                platforms: PLATFORMS.ALL_MAJOR,
                exclude_additions: 'true',
            });

            let popularGames = (popularData.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 500);
            popularGames = sortByPopularity(popularGames).slice(0, 20);

            // ============================================================
            // TOP RATED GAMES - Metacritic 85+, 500+ reviews
            // ============================================================
            const topRatedData = await rawgFetch('/games', {
                ordering: '-metacritic',
                metacritic: '85,100',
                page_size: '40',
                platforms: PLATFORMS.ALL_MAJOR,
                exclude_additions: 'true',
            });

            let topRatedGames = (topRatedData.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 500);
            topRatedGames = sortByRatingThenPopularity(topRatedGames).slice(0, 20);

            // ============================================================
            // NEW RELEASES - Last 90 days, minimum 6 games
            // ============================================================
            const newReleasesData = await rawgFetch('/games', {
                dates: `${ninetyDaysAgo},${today}`,
                ordering: '-released',
                page_size: '30',
                platforms: PLATFORMS.ALL_MAJOR,
                exclude_additions: 'true',
            });

            let newReleases = (newReleasesData.results || [])
                .filter(validateGame)
                .filter((g: any) => {
                    if (!g.released) return false;
                    const releaseDate = new Date(g.released);
                    const cutoffDate = new Date(ninetyDaysAgo);
                    return releaseDate >= cutoffDate && releaseDate <= new Date(today);
                });
            newReleases = sortByReleaseDate(newReleases);
            // Ensure at least 6 games
            if (newReleases.length < 6) {
                // Fetch more if needed
                const additionalData = await rawgFetch('/games', {
                    dates: `${getDateXDaysAgo(180)},${today}`,
                    ordering: '-released,-added',
                    page_size: '20',
                    platforms: PLATFORMS.ALL_MAJOR,
                    exclude_additions: 'true',
                });
                const additional = (additionalData.results || [])
                    .filter(validateGame)
                    .filter((g: any) => !newReleases.find((n: any) => n.id === g.id));
                newReleases = [...newReleases, ...additional].slice(0, 12);
            } else {
                newReleases = newReleases.slice(0, 12);
            }

            // ============================================================
            // DESKTOP GAMES (PC, Mac, Linux)
            // ============================================================
            const desktopData = await rawgFetch('/games', {
                ordering: '-added',
                page_size: '40',
                platforms: PLATFORMS.DESKTOP_ALL,
                exclude_additions: 'true',
            });

            let desktopGames = (desktopData.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 500);
            desktopGames = sortByPopularity(desktopGames).slice(0, 20);

            // ============================================================
            // PHONE GAMES (iOS, Android)
            // ============================================================
            const mobileData = await rawgFetch('/games', {
                ordering: '-added',
                page_size: '40',
                platforms: PLATFORMS.MOBILE_ALL,
                exclude_additions: 'true',
            });

            let mobileGames = (mobileData.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 100);
            mobileGames = sortByPopularity(mobileGames).slice(0, 20);

            // ============================================================
            // ACTION GAMES
            // ============================================================
            const actionData = await rawgFetch('/games', {
                genres: String(GENRE_IDS.action),
                ordering: '-added',
                page_size: '40',
                platforms: PLATFORMS.ALL_MAJOR,
                exclude_additions: 'true',
            });

            let actionGames = (actionData.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 500);
            actionGames = sortByPopularity(actionGames).slice(0, 20);

            // ============================================================
            // RPG GAMES
            // ============================================================
            const rpgData = await rawgFetch('/games', {
                genres: String(GENRE_IDS.rpg),
                ordering: '-added',
                page_size: '40',
                platforms: PLATFORMS.ALL_MAJOR,
                exclude_additions: 'true',
            });

            let rpgGames = (rpgData.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 500);
            rpgGames = sortByPopularity(rpgGames).slice(0, 20);

            // ============================================================
            // ADVENTURE GAMES
            // ============================================================
            const adventureData = await rawgFetch('/games', {
                genres: String(GENRE_IDS.adventure),
                ordering: '-added',
                page_size: '40',
                platforms: PLATFORMS.ALL_MAJOR,
                exclude_additions: 'true',
            });

            let adventureGames = (adventureData.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 500);
            adventureGames = sortByPopularity(adventureGames).slice(0, 20);

            // Build response (removed desktop and mobile sections)
            const homeData = {
                popular: popularGames,
                topRated: topRatedGames,
                newReleases: newReleases,
                action: actionGames,
                rpg: rpgGames,
                adventure: adventureGames,
                cachedAt: Date.now(),
            };

            setCache(cacheKey, homeData, CACHE_24H);
            console.log('[Games] Homepage data cached for 24 hours');
            res.json(homeData);

        } catch (error) {
            console.error('[Games] Error fetching home data:', error);
            res.status(500).json({ error: 'Failed to fetch games data' });
        }
    });

    // ============================================================
    // GET /api/games/search - Search games (RAWG API)
    // ============================================================
    app.get('/api/games/search', async (req: Request, res: Response) => {
        try {
            const query = req.query.q as string;
            const page = (req.query.page as string) || '1';

            if (!query || query.length < 2) {
                return res.status(400).json({ error: 'Search query too short' });
            }

            const cacheKey = `games_search_v3_${query}_${page}`;
            const cached = getCached(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            const data = await rawgFetch('/games', {
                search: query,
                search_precise: 'true',
                page,
                page_size: '20',
                exclude_additions: 'true',
            });

            let results = (data.results || []).filter(validateGame);

            // Sort by relevance then popularity
            results = results.sort((a: any, b: any) => {
                const queryLower = query.toLowerCase();
                const aNameLower = (a.name || '').toLowerCase();
                const bNameLower = (b.name || '').toLowerCase();

                // Exact match priority
                const aExact = aNameLower === queryLower ? 1 : 0;
                const bExact = bNameLower === queryLower ? 1 : 0;
                if (aExact !== bExact) return bExact - aExact;

                // Starts with query priority
                const aStarts = aNameLower.startsWith(queryLower) ? 1 : 0;
                const bStarts = bNameLower.startsWith(queryLower) ? 1 : 0;
                if (aStarts !== bStarts) return bStarts - aStarts;

                // Contains query priority
                const aContains = aNameLower.includes(queryLower) ? 1 : 0;
                const bContains = bNameLower.includes(queryLower) ? 1 : 0;
                if (aContains !== bContains) return bContains - aContains;

                // Then popularity
                return (b.added || 0) - (a.added || 0);
            });

            const response = { ...data, results };

            setCache(cacheKey, response, CACHE_1H);
            res.json(response);

        } catch (error) {
            console.error('[Games] Error searching:', error);
            res.status(500).json({ error: 'Failed to search games' });
        }
    });

    // ============================================================
    // GET /api/games/:id - Game details with 7d cache
    // ============================================================
    app.get('/api/games/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(Number(id))) {
                return res.status(400).json({ error: 'Invalid game ID' });
            }

            const cacheKey = `game_detail_v3_${id}`;
            const cached = getCached(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            console.log('[Games] Fetching game details for:', id);

            // Fetch all data in parallel
            const [rawgDetail, screenshots, movies, rawgSimilar] = await Promise.all([
                rawgFetch(`/games/${id}`),
                rawgFetch(`/games/${id}/screenshots`, { page_size: '10' }).catch(() => ({ results: [] })),
                rawgFetch(`/games/${id}/movies`, { page_size: '5' }).catch(() => ({ results: [] })),
                rawgFetch(`/games/${id}/suggested`, { page_size: '20' }).catch(() => ({ results: [] })),
            ]);

            // Filter similar games from RAWG suggested
            let similarGames = (rawgSimilar.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 100);
            similarGames = sortByPopularity(similarGames).slice(0, 12);

            // Fallback: If no similar games, fetch games from same genre
            if (similarGames.length === 0 && rawgDetail.genres && rawgDetail.genres.length > 0) {
                try {
                    const primaryGenre = rawgDetail.genres[0].slug;
                    console.log('[Games] Fetching fallback similar games from genre:', primaryGenre);

                    const genreGames = await rawgFetch('/games', {
                        genres: primaryGenre,
                        ordering: '-added',
                        page_size: '20',
                        platforms: PLATFORMS.ALL_MAJOR,
                        exclude_additions: 'true',
                    });

                    similarGames = (genreGames.results || [])
                        .filter(validateGame)
                        .filter((g: any) => g.id !== parseInt(id)) // Exclude current game
                        .filter((g: any) => (g.ratings_count || 0) >= 500);
                    similarGames = sortByPopularity(similarGames).slice(0, 12);
                } catch (e) {
                    console.warn('[Games] Failed to fetch fallback similar games');
                }
            }

            // Try GameBrain for store links
            let storeLinks: any[] = [];

            if (GAMEBRAIN_API_KEY && rawgDetail.name) {
                try {
                    const gbSearch = await gamebrainFetch('/search-games', {
                        query: rawgDetail.name,
                        number: '1',
                    });

                    if (gbSearch?.results?.[0]) {
                        const gbDetail = await gamebrainFetch('/retrieve-game', {
                            id: String(gbSearch.results[0].id),
                        });
                        if (gbDetail?.offers) {
                            storeLinks = gbDetail.offers;
                        }
                    }
                } catch (e) {
                    console.warn('[Games] GameBrain enrichment failed');
                }
            }

            const combinedData = {
                ...rawgDetail,
                screenshots: screenshots.results || [],
                movies: movies.results || [],
                similarGames: similarGames,
                storeLinks,
            };

            setCache(cacheKey, combinedData, CACHE_7D);
            res.json(combinedData);

        } catch (error) {
            console.error('[Games] Error fetching game details:', error);
            res.status(500).json({ error: 'Failed to fetch game details' });
        }
    });

    // ============================================================
    // GET /api/games/:id/similar - Similar games
    // ============================================================
    app.get('/api/games/:id/similar', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const cacheKey = `game_similar_v3_${id}`;
            const cached = getCached(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            const data = await rawgFetch(`/games/${id}/suggested`, { page_size: '20' });

            let results = (data.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 100);
            results = sortByPopularity(results).slice(0, 12);

            const response = { ...data, results };

            setCache(cacheKey, response, CACHE_24H);
            res.json(response);

        } catch (error) {
            console.error('[Games] Error fetching similar games:', error);
            res.status(500).json({ error: 'Failed to fetch similar games' });
        }
    });

    // ============================================================
    // GET /api/games/genre/:slug - Games by genre
    // ============================================================
    app.get('/api/games/genre/:slug', async (req: Request, res: Response) => {
        try {
            const { slug } = req.params;
            const page = (req.query.page as string) || '1';

            const cacheKey = `games_genre_v3_${slug}_${page}`;
            const cached = getCached(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            const data = await rawgFetch('/games', {
                genres: slug,
                ordering: '-added',
                page,
                page_size: '40',
                platforms: PLATFORMS.ALL_MAJOR,
                exclude_additions: 'true',
            });

            let results = (data.results || [])
                .filter(validateGame)
                .filter((g: any) => (g.ratings_count || 0) >= 500);
            results = sortByPopularity(results).slice(0, 20);

            const response = { ...data, results };

            setCache(cacheKey, response, CACHE_24H);
            res.json(response);

        } catch (error) {
            console.error('[Games] Error fetching games by genre:', error);
            res.status(500).json({ error: 'Failed to fetch games by genre' });
        }
    });
}
