import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2, Gamepad2, Star, Calendar } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { gamesApi } from '@/lib/games';
import { RAWGGame } from '@/types/games';

interface GameSearchDropdownProps {
    results: RAWGGame[];
    isVisible: boolean;
    onItemClick: (game: RAWGGame) => void;
}

export function GameSearchDropdown({
    results,
    isVisible,
    onItemClick,
}: GameSearchDropdownProps) {
    if (!isVisible || results.length === 0) return null;

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {results.slice(0, 8).map((game) => (
                <div
                    key={game.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onItemClick(game)}
                >
                    {/* Game thumbnail - same style as movie search */}
                    <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                        {game.background_image ? (
                            <img
                                src={game.background_image}
                                alt={game.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Gamepad2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Game info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{game.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {game.released && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(game.released).getFullYear()}
                                </span>
                            )}
                            {game.rating > 0 && (
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {game.rating.toFixed(1)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

interface GameSearchProps {
    className?: string;
}

export function GameSearch({ className = '' }: GameSearchProps) {
    const [, navigate] = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['games-search', debouncedSearchTerm],
        queryFn: () => gamesApi.searchGames(debouncedSearchTerm),
        enabled: debouncedSearchTerm.length >= 3,
        staleTime: 5 * 60 * 1000,
    });

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchVisible(false);
                setIsSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show search results when we have them
    useEffect(() => {
        if (searchResults?.results && searchResults.results.length > 0) {
            setIsSearchVisible(true);
        }
    }, [searchResults]);

    const handleSearchResultClick = (game: RAWGGame) => {
        setIsSearchVisible(false);
        setIsSearchFocused(false);
        setSearchTerm('');
        navigate(`/games/${game.id}`);
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        if (searchResults?.results && searchResults.results.length > 0) {
            setIsSearchVisible(true);
        }
    };

    return (
        <div className={`relative ${className}`} ref={searchRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="w-full px-4 py-2 pl-10 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    data-testid="game-search-input"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />

                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin w-4 h-4" />
                )}

                {searchTerm && !isLoading && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setIsSearchVisible(false);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <GameSearchDropdown
                results={searchResults?.results || []}
                isVisible={isSearchVisible && searchTerm.length >= 3}
                onItemClick={handleSearchResultClick}
            />
        </div>
    );
}
