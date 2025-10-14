import { TVShow } from '@/types/tmdb';
import { tmdbApi } from '@/lib/tmdb';
import { Calendar, Star } from 'lucide-react';

interface AnimeCardProps {
  item: TVShow;
  onClick: () => void;
  className?: string;
}

export function AnimeCard({ item, onClick, className = '' }: AnimeCardProps) {
  const year = item.first_air_date ? new Date(item.first_air_date).getFullYear() : '';
  // Compose title: English (name) + Japanese (original_name) if available and different
  const showJa = item.original_language === 'ja' && item.original_name && item.original_name !== item.name;
  const title = showJa ? `${item.name} / ${item.original_name}` : item.name;

  return (
    <div 
      className={`card-hover cursor-pointer ${className}`}
      onClick={onClick}
      data-testid={`anime-card-${item.id}`}
    >
      <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
        <div className="aspect-[2/3] relative overflow-hidden">
          {item.poster_path ? (
            <img
              src={tmdbApi.getImageUrl(item.poster_path)}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}

          {item.vote_average > 0 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 
            className="font-semibold text-sm mb-2 line-clamp-2 leading-tight"
            data-testid={`anime-title-${item.id}`}
          >
            {title}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {year && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{year}</span>
              </div>
            )}

            {item.vote_average > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{item.vote_average.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
