import { RAWGGame } from '@/types/games';
import { Calendar, Star } from 'lucide-react';

interface GameCardProps {
    game: RAWGGame;
    onClick: () => void;
    className?: string;
}

export function GameCard({ game, onClick, className = '' }: GameCardProps) {
    const year = game.released ? new Date(game.released).getFullYear() : '';

    return (
        <div
            className={`card-hover cursor-pointer ${className}`}
            onClick={onClick}
            data-testid={`game-card-${game.id}`}
        >
            <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
                {/* Poster Image - Same aspect ratio as MovieCard */}
                <div className="aspect-[2/3] relative overflow-hidden">
                    {game.background_image ? (
                        <img
                            src={game.background_image}
                            alt={game.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No Image</span>
                        </div>
                    )}

                    {/* Rating Badge - Same style as MovieCard */}
                    {game.rating > 0 && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{game.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Card Content - Same layout as MovieCard */}
                <div className="p-4">
                    <h3
                        className="font-semibold text-sm mb-2 line-clamp-2 leading-tight"
                        data-testid={`game-title-${game.id}`}
                    >
                        {game.name}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {year && (
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{year}</span>
                            </div>
                        )}

                        {game.rating > 0 && (
                            <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{game.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
