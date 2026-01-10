// RAWG API Types

export interface RAWGGame {
    id: number;
    slug: string;
    name: string;
    released: string;
    tba: boolean;
    background_image: string;
    rating: number;
    rating_top: number;
    ratings_count: number;
    reviews_text_count: number;
    added: number;
    metacritic: number | null;
    playtime: number;
    suggestions_count: number;
    updated: string;
    esrb_rating: ESRBRating | null;
    platforms: PlatformWrapper[];
    genres: Genre[];
    stores: StoreWrapper[];
    tags: Tag[];
    short_screenshots: Screenshot[];
    parent_platforms: ParentPlatformWrapper[];
}

export interface RAWGGameDetail extends RAWGGame {
    description: string;
    description_raw: string;
    website: string;
    developers: Developer[];
    publishers: Publisher[];
    clip: Clip | null;
    movies: GameMovie[];
    screenshots_count: number;
    movies_count: number;
    creators_count: number;
    achievements_count: number;
    reddit_url: string;
    reddit_name: string;
    reddit_description: string;
    reddit_logo: string;
    reddit_count: number;
    twitch_count: number;
    youtube_count: number;
    alternative_names: string[];
}

export interface ESRBRating {
    id: number;
    slug: string;
    name: string;
}

export interface PlatformWrapper {
    platform: Platform;
    released_at: string;
    requirements: Requirements | null;
}

export interface Platform {
    id: number;
    slug: string;
    name: string;
    image: string | null;
    year_end: number | null;
    year_start: number | null;
    games_count: number;
    image_background: string;
}

export interface ParentPlatformWrapper {
    platform: {
        id: number;
        slug: string;
        name: string;
    };
}

export interface Requirements {
    minimum?: string;
    recommended?: string;
}

export interface Genre {
    id: number;
    slug: string;
    name: string;
    games_count: number;
    image_background: string;
}

export interface StoreWrapper {
    id: number;
    store: Store;
    url?: string;
}

export interface Store {
    id: number;
    slug: string;
    name: string;
    domain: string;
    games_count: number;
    image_background: string;
}

export interface Tag {
    id: number;
    slug: string;
    name: string;
    language: string;
    games_count: number;
    image_background: string;
}

export interface Screenshot {
    id: number;
    image: string;
}

export interface Developer {
    id: number;
    slug: string;
    name: string;
    games_count: number;
    image_background: string;
}

export interface Publisher {
    id: number;
    slug: string;
    name: string;
    games_count: number;
    image_background: string;
}

export interface Clip {
    clip: string;
    clips: { [key: string]: string };
    preview: string;
    video: string;
}

export interface GameMovie {
    id: number;
    name: string;
    preview: string;
    data: {
        480: string;
        max: string;
    };
}

// API Response Types
export interface RAWGResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface RAWGScreenshotsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: {
        id: number;
        image: string;
        width: number;
        height: number;
        is_deleted: boolean;
    }[];
}

export interface RAWGMoviesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: GameMovie[];
}

// GameBrain API Types (for similar games & store links)
export interface GameBrainGame {
    id: number;
    name: string;
    year: number;
    genre: string;
    image: string;
    link: string;
    rating: {
        mean: number;
        count: number;
    };
    adult_only: boolean;
    screenshots: string[];
    micro_trailer?: string;
    gameplay?: string;
    short_description: string;
    platforms: { value: string; name: string }[];
}

export interface GameBrainGameDetail extends GameBrainGame {
    description: string;
    release_date: string;
    developer: string;
    playtime?: {
        percentiles: number[];
        min: number;
        median: number;
        max: number;
        mean: number;
        mentions: number;
    };
    tags: string[];
    genres: { value: string; name: string }[];
    themes: { value: string; name: string }[];
    play_modes: { value: string; name: string }[];
    videos: string[];
    offers: {
        price: {
            currency: string;
            discount_percent: number;
            value: number;
            initial: number;
        };
        store_name: string;
        platform: string;
        title: string;
        url: string;
    }[];
    official_stores: {
        source: string;
        url: string;
    }[];
    x_url?: string;
}

export interface GameBrainSearchResponse {
    query: string;
    total_results: number;
    limit: number;
    offset: number;
    results: GameBrainGame[];
}

// Homepage data structure (combined from RAWG + caching)
export interface GamesHomeData {
    popular: RAWGGame[];
    topRated: RAWGGame[];
    newReleases: RAWGGame[];
    action: RAWGGame[];
    rpg: RAWGGame[];
    adventure: RAWGGame[];
    shooter: RAWGGame[];
    multiplayer: RAWGGame[];
    hiddenGems: RAWGGame[];
    cachedAt: number;
}

// Combined game detail with both APIs
export interface CombinedGameDetail {
    rawg: RAWGGameDetail;
    gamebrain?: GameBrainGameDetail;
    screenshots: RAWGScreenshotsResponse['results'];
    movies: GameMovie[];
    similarGames: RAWGGame[];
    storeLinks: GameBrainGameDetail['offers'];
}
