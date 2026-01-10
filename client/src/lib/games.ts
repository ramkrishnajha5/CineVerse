// Games API Client Library
// All API calls are proxied through our backend to protect API keys

import type {
    RAWGGame,
    RAWGGameDetail,
    RAWGResponse,
} from '@/types/games';

const API_BASE = '/api/games';

// Homepage data structure matching backend
export interface GamesHomeData {
    popular: RAWGGame[];
    topRated: RAWGGame[];
    newReleases: RAWGGame[];
    action: RAWGGame[];
    rpg: RAWGGame[];
    adventure: RAWGGame[];
    cachedAt: number;
}

// Extended game detail with enriched data
export interface EnrichedGameDetail extends RAWGGameDetail {
    screenshots: { id: number; image: string; width: number; height: number }[];
    movies: {
        id: number;
        name: string;
        preview: string;
        data: { 480: string; max: string };
    }[];
    similarGames: RAWGGame[];
    storeLinks: {
        price: { currency: string; discount_percent: number; value: number; initial: number };
        store_name: string;
        platform: string;
        title: string;
        url: string;
    }[];
}

class GamesApi {
    // Fetch homepage data (cached for 24 hours on backend)
    async getHomeData(): Promise<GamesHomeData> {
        const response = await fetch(`${API_BASE}/home`);
        if (!response.ok) {
            throw new Error('Failed to fetch games home data');
        }
        return response.json();
    }

    // Search games (RAWG API)
    async searchGames(query: string, page: number = 1): Promise<RAWGResponse<RAWGGame>> {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&page=${page}`);
        if (!response.ok) {
            throw new Error('Failed to search games');
        }
        return response.json();
    }

    // Get game details (cached for 7 days on backend)
    async getGameDetails(id: number): Promise<EnrichedGameDetail> {
        const response = await fetch(`${API_BASE}/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch game details');
        }
        return response.json();
    }

    // Get similar games
    async getSimilarGames(id: number): Promise<RAWGResponse<RAWGGame>> {
        const response = await fetch(`${API_BASE}/${id}/similar`);
        if (!response.ok) {
            throw new Error('Failed to fetch similar games');
        }
        return response.json();
    }

    // Get games by genre
    async getGamesByGenre(genre: string, page: number = 1): Promise<RAWGResponse<RAWGGame>> {
        const response = await fetch(`${API_BASE}/genre/${genre}?page=${page}`);
        if (!response.ok) {
            throw new Error('Failed to fetch games by genre');
        }
        return response.json();
    }
}

export const gamesApi = new GamesApi();
