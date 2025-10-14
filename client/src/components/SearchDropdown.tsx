import { SearchResult } from '@/types/tmdb';
import { tmdbApi } from '@/lib/tmdb';
import { Calendar, Film, Tv, User } from 'lucide-react';

interface SearchDropdownProps {
  results: SearchResult[];
  isVisible: boolean;
  onItemClick: (result: SearchResult) => void;
}

export function SearchDropdown({ results, isVisible, onItemClick }: SearchDropdownProps) {
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