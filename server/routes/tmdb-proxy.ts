import { Express } from 'express';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Retry fetch with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeout);
      
      // If rate limited, wait and retry
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
        console.warn(`TMDB rate limited. Retrying after ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`TMDB API returned ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      
      if (error.name === 'AbortError') {
        console.error(`TMDB request timeout (attempt ${i + 1}/${maxRetries})`);
      } else {
        console.error(`TMDB request failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      }
      
      // Exponential backoff: 1s, 2s, 4s
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch from TMDB after retries');
}

export function registerTMDBProxy(app: Express) {
  // Proxy all TMDB API requests with caching and retry logic
  app.get('/api/tmdb/*', async (req, res) => {
    try {
      const path = req.path.replace('/api/tmdb', '');
      const queryParams = new URLSearchParams(req.query as any).toString();
      const tmdbUrl = `https://api.themoviedb.org/3${path}${queryParams ? `?${queryParams}` : ''}`;
      
      // Check cache first
      const cached = cache.get(tmdbUrl);
      if (cached && cached.expires > Date.now()) {
        console.log(`[TMDB Cache Hit] ${path}`);
        return res.json(cached.data);
      }
      
      console.log(`[TMDB Request] ${path}`);
      
      // Fetch with retry logic
      const response = await fetchWithRetry(tmdbUrl);
      const data = await response.json();
      
      // Cache successful response
      cache.set(tmdbUrl, {
        data,
        expires: Date.now() + CACHE_TTL,
      });
      
      // Clean old cache entries (keep cache size manageable)
      if (cache.size > 500) {
        const now = Date.now();
        for (const [key, value] of Array.from(cache.entries())) {
          if (value.expires < now) {
            cache.delete(key);
          }
        }
      }
      
      res.json(data);
    } catch (error: any) {
      console.error('[TMDB Proxy Error]', {
        path: req.path,
        error: error.message,
        stack: error.stack,
      });
      
      res.status(503).json({ 
        error: 'Failed to fetch from TMDB',
        message: error.message,
        retryable: true,
      });
    }
  });
}
