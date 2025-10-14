import { Movie, TVShow } from '@/types/tmdb';
import { tmdbApi } from '@/lib/tmdb';
import { Calendar, Star } from 'lucide-react';

interface MovieCardProps {
  item: Movie | TVShow;
  type: 'movie' | 'tv';
  onClick: () => void;
  className?: string;
}

export function MovieCard({ item, type, onClick, className = '' }: MovieCardProps) {
  const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
  const releaseDate = type === 'movie' ? (item as Movie).release_date : (item as TVShow).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

  return (
    <div 
      className={`card-hover cursor-pointer ${className}`}
      onClick={onClick}
      data-testid={`${type}-card-${item.id}`}
    >
      <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
        {/* Poster Image */}
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
          
          {/* Rating Badge */}
          {item.vote_average > 0 && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        {/* Card Content */}
        <div className="p-4">
          <h3 
            className="font-semibold text-sm mb-2 line-clamp-2 leading-tight"
            data-testid={`${type}-title-${item.id}`}
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
