import { SearchResult } from '@/types/tmdb';
import { tmdbApi } from '@/lib/tmdb';
import { Calendar, Film, Tv, User, Clock, X } from 'lucide-react';

// LocalStorage key for recent searches
const RECENT_SEARCHES_KEY = 'cineverse_recent_searches';
const MAX_RECENT_SEARCHES = 3;

// Helper functions for localStorage
export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): void {
  try {
    const searches = getRecentSearches();
    // Remove if already exists (to move to top)
    const filtered = searches.filter(s => s.toLowerCase() !== term.toLowerCase());
    // Add to beginning
    filtered.unshift(term);
    // Keep only last 3
    const trimmed = filtered.slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore localStorage errors
  }
}

export function removeRecentSearch(term: string): void {
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== term.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

interface SearchDropdownProps {
  results: SearchResult[];
  isVisible: boolean;
  onItemClick: (result: SearchResult) => void;
  showRecentSearches?: boolean;
  onRecentSearchClick?: (term: string) => void;
  onRemoveRecentSearch?: (term: string) => void;
}

export function SearchDropdown({
  results,
  isVisible,
  onItemClick,
  showRecentSearches = false,
  onRecentSearchClick,
  onRemoveRecentSearch
}: SearchDropdownProps) {
  const recentSearches = getRecentSearches();

  // Show recent searches when no search term
  if (showRecentSearches && recentSearches.length > 0) {
    return (
      <div className="sm:absolute sm:top-full sm:left-0 sm:right-0 sm:mt-2 bg-popover sm:border border-border sm:rounded-lg sm:shadow-lg z-50 search-dropdown w-full">
        <div className="px-3 py-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recent Searches
          </span>
        </div>
        {recentSearches.map((term, index) => (
          <div
            key={`recent-${index}`}
            className="group flex items-center justify-between p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 transition-colors"
          >
            <div
              className="flex items-center gap-3 flex-1 min-w-0"
              onMouseDown={(e) => {
                e.preventDefault();
                onRecentSearchClick?.(term);
              }}
            >
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground truncate">{term}</span>
            </div>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveRecentSearch?.(term);
              }}
              className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
              title="Remove from recent searches"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (!isVisible || results.length === 0) return null;

  const getIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return <Film className="w-4 h-4 text-muted-foreground" />;
      case 'tv':
        return <Tv className="w-4 h-4 text-muted-foreground" />;
      case 'person':
        return <User className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Film className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTitle = (result: SearchResult) => {
    return result.title || result.name || 'Unknown';
  };

  const getYear = (result: SearchResult) => {
    const date = result.release_date || result.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };

  const getMediaTypeLabel = (mediaType: string) => {
    switch (mediaType) {
      case 'movie':
        return 'Movie';
      case 'tv':
        return 'TV Show';
      case 'person':
        return 'Person';
      default:
        return 'Unknown';
    }
  };

  const handleItemClick = (result: SearchResult) => {
    onItemClick(result);
  };

  return (
    <div className="sm:absolute sm:top-full sm:left-0 sm:right-0 sm:mt-2 bg-popover sm:border border-border sm:rounded-lg sm:shadow-lg z-50 search-dropdown w-full">
      {results.map((result) => (
        <div
          key={`${result.media_type}-${result.id}`}
          className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 transition-colors"
          onMouseDown={(e) => {
            // Use mousedown so it fires before document mousedown handler that closes the dropdown
            e.preventDefault();
            handleItemClick(result);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleItemClick(result);
            }
          }}
          role="button"
          tabIndex={0}
          data-testid={`search-result-${result.id}`}
        >
          <div className="flex items-center space-x-3">
            {result.poster_path || result.profile_path ? (
              <img
                src={tmdbApi.getImageUrl(result.poster_path || result.profile_path || '', 'w92')}
                alt={getTitle(result)}
                className="w-8 h-12 object-cover rounded"
                loading="lazy"
              />
            ) : (
              <div className="w-8 h-12 bg-muted rounded flex items-center justify-center">
                {getIcon(result.media_type)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">
                {getTitle(result)}
              </div>
              <div className="text-sm text-muted-foreground flex items-center space-x-2">
                <span>{getMediaTypeLabel(result.media_type)}</span>
                {getYear(result) && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{getYear(result)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {result.vote_average && result.vote_average > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm text-muted-foreground">
                  {result.vote_average.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}