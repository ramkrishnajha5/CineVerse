import { Movie, TVShow, MovieDetail, TVDetail, Credits, Videos, SearchResponse, TMDbResponse, PersonDetail, CombinedCredits } from '@/types/tmdb';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '2f0c4d355398a7cb7b60f0ffdb48222e';
const BASE_URL = import.meta.env.DEV ? '/api/tmdb' : 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

class TMDbAPI {
  private async fetchFromTMDb<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDb API Error: ${response.status} - ${response.statusText}`);
    }
    
    return response.json();
  }

  // Image URLs
  getImageUrl(path: string, size: string = 'w500'): string {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : '';
  }

  getBackdropUrl(path: string, size: string = 'w1280'): string {
    return path ? `${IMAGE_BASE_URL}/${size}${path}` : '';
  }

  // Search
  async searchMulti(query: string): Promise<SearchResponse> {
    return this.fetchFromTMDb(`/search/multi?query=${encodeURIComponent(query)}`);
  }

  // Trending
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'day'): Promise<TMDbResponse<Movie>> {
    return this.fetchFromTMDb(`/trending/movie/${timeWindow}`);
  }

  async getTrendingTVShows(timeWindow: 'day' | 'week' = 'day'): Promise<TMDbResponse<TVShow>> {
    return this.fetchFromTMDb(`/trending/tv/${timeWindow}`);
  }

  // Anime: Trending (TV) filtered by Japanese language or Animation genre (16)
  async getTrendingAnime(timeWindow: 'day' | 'week' = 'day'): Promise<TMDbResponse<TVShow>> {
    const res = await this.getTrendingTVShows(timeWindow);
    const filtered = res.results.filter((tv) => tv.original_language === 'ja' || tv.genre_ids?.includes(16));
    return { ...res, results: filtered };
  }

  // Popular Movies by Region
  async getPopularMovies(region?: string): Promise<TMDbResponse<Movie>> {
    const regionParam = region ? `&region=${region}` : '';
    return this.fetchFromTMDb(`/movie/popular?${regionParam}`);
  }

  async getPopularMoviesByOrigin(originCountry: string): Promise<TMDbResponse<Movie>> {
    return this.fetchFromTMDb(`/discover/movie?with_origin_country=${originCountry}&sort_by=popularity.desc`);
  }

  // Popular TV Shows by Region
  async getPopularTVShows(region?: string): Promise<TMDbResponse<TVShow>> {
    const regionParam = region ? `&region=${region}` : '';
    return this.fetchFromTMDb(`/tv/popular?${regionParam}`);
  }

  async getPopularTVShowsByOrigin(originCountry: string): Promise<TMDbResponse<TVShow>> {
    return this.fetchFromTMDb(`/discover/tv?with_origin_country=${originCountry}&sort_by=popularity.desc`);
  }

  // Anime: Popular via discover TV with Japanese original language
  async getPopularAnime(): Promise<TMDbResponse<TVShow>> {
    return this.fetchFromTMDb(`/discover/tv?with_original_language=ja&sort_by=popularity.desc`);
  }

  // Anime Movies: Popular via discover MOVIE with Animation genre and Japanese language
  async getPopularAnimeMovies(): Promise<TMDbResponse<Movie>> {
    return this.fetchFromTMDb(`/discover/movie?with_genres=16&with_original_language=ja&sort_by=popularity.desc`);
  }

  // Movie Details
  async getMovieDetails(movieId: number): Promise<MovieDetail> {
    return this.fetchFromTMDb(`/movie/${movieId}`);
  }

  async getMovieCredits(movieId: number): Promise<Credits> {
    return this.fetchFromTMDb(`/movie/${movieId}/credits`);
  }

  async getMovieVideos(movieId: number): Promise<Videos> {
    return this.fetchFromTMDb(`/movie/${movieId}/videos`);
  }

  async getSimilarMovies(movieId: number): Promise<TMDbResponse<Movie>> {
    return this.fetchFromTMDb(`/movie/${movieId}/similar`);
  }

  // TV Show Details
  async getTVShowDetails(tvId: number): Promise<TVDetail> {
    return this.fetchFromTMDb(`/tv/${tvId}`);
  }

  async getTVShowCredits(tvId: number): Promise<Credits> {
    return this.fetchFromTMDb(`/tv/${tvId}/credits`);
  }

  async getTVShowVideos(tvId: number): Promise<Videos> {
    return this.fetchFromTMDb(`/tv/${tvId}/videos`);
  }

  async getSimilarTVShows(tvId: number): Promise<TMDbResponse<TVShow>> {
    return this.fetchFromTMDb(`/tv/${tvId}/similar`);
  }

  // Get regional similar content with genre matching
  async getRegionalSimilarMovies(movieId: number, originCountry: string, genres: string): Promise<TMDbResponse<Movie>> {
    return this.fetchFromTMDb(`/discover/movie?with_origin_country=${originCountry}&with_genres=${genres}&sort_by=popularity.desc`);
  }

  async getRegionalSimilarTVShows(tvId: number, originCountry: string, genres: string): Promise<TMDbResponse<TVShow>> {
    return this.fetchFromTMDb(`/discover/tv?with_origin_country=${originCountry}&with_genres=${genres}&sort_by=popularity.desc`);
  }

  async getGenreSimilarMovies(movieId: number, genres: string): Promise<TMDbResponse<Movie>> {
    return this.fetchFromTMDb(`/discover/movie?with_genres=${genres}&sort_by=popularity.desc`);
  }

  async getGenreSimilarTVShows(tvId: number, genres: string): Promise<TMDbResponse<TVShow>> {
    return this.fetchFromTMDb(`/discover/tv?with_genres=${genres}&sort_by=popularity.desc`);
  }

  // Anime: similar shows filtered by Japanese language and genres
  async getGenreSimilarAnime(genres: string): Promise<TMDbResponse<TVShow>> {
    return this.fetchFromTMDb(`/discover/tv?with_original_language=ja&with_genres=${genres}&sort_by=popularity.desc`);
  }

  // Popular Trailers (from popular movies)
  // Upcoming Movies
  async getUpcomingMovies(region?: string): Promise<TMDbResponse<Movie>> {
    const regionParam = region ? `&region=${region}` : '';
    return this.fetchFromTMDb(`/movie/upcoming?${regionParam}`);
  }

  async getPopularTrailers(): Promise<Array<{ movie: Movie; trailers: Videos }>> {
    const popularMovies = await this.getPopularMovies();
    const trailersPromises = popularMovies.results.slice(0, 10).map(async (movie) => {
      const videos = await this.getMovieVideos(movie.id);
      return { movie, trailers: videos };
    });
    
    return Promise.all(trailersPromises);
  }

  // Person Details
  async getPersonDetails(personId: number): Promise<PersonDetail> {
    return this.fetchFromTMDb(`/person/${personId}`);
  }

  async getPersonCombinedCredits(personId: number): Promise<CombinedCredits> {
    return this.fetchFromTMDb(`/person/${personId}/combined_credits`);
  }
}

export const tmdbApi = new TMDbAPI();
