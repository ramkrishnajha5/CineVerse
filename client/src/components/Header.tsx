
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Menu, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ThemeToggle } from './ThemeToggle';
import { SearchDropdown, addRecentSearch, removeRecentSearch, getRecentSearches } from './SearchDropdown';
import { useDebounce } from '@/hooks/useDebounce';
import { tmdbApi } from '@/lib/tmdb';
import { SearchResult } from '@/types/tmdb';
import logoImage from '@assets/CineVerseLogo_1757144469036.png';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, type UserProfile } from '@/lib/firestore';

export function Header() {
  const [location, navigate] = useLocation();
  const { user, signOutUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const [recentSearchesKey, setRecentSearchesKey] = useState(0); // Force re-render
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 800);

  const { data: searchResults } = useQuery({
    queryKey: ['/search/multi', debouncedSearchTerm],
    queryFn: () => tmdbApi.searchMulti(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load user profile for header avatar/name
  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!user?.uid) { setProfile(null); return; }
      try {
        const p = await getUserProfile(user.uid);
        if (!canceled) setProfile(p);
      } catch {
        if (!canceled) setProfile(null);
      }
    })();
    return () => { canceled = true; };
  }, [user?.uid]);

  // Handle click outside search to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchVisible(false);
        setIsSearchFocused(false);
        setIsMobileSearchExpanded(false);
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

  const handleSearchResultClick = (result: SearchResult) => {
    // Save to recent searches
    const title = result.title || result.name || '';
    if (title) {
      addRecentSearch(title);
      setRecentSearchesKey(prev => prev + 1);
    }

    setIsSearchVisible(false);
    setIsSearchFocused(false);
    setSearchTerm('');
    setIsMobileSearchExpanded(false);

    if (result.media_type === 'movie') {
      navigate(`/movie/${result.id}`);
    } else if (result.media_type === 'tv') {
      navigate(`/tv/${result.id}`);
    }
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    setIsSearchFocused(false);
    // Trigger a search with this term
  };

  const handleRemoveRecentSearch = (term: string) => {
    removeRecentSearch(term);
    setRecentSearchesKey(prev => prev + 1); // Force re-render
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleMobileSearchToggle = () => {
    setIsMobileSearchExpanded(!isMobileSearchExpanded);
    if (!isMobileSearchExpanded) {
      // Focus on the input when expanding
      setTimeout(() => {
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }, 100);
    } else {
      setSearchTerm('');
      setIsSearchVisible(false);
      setIsSearchFocused(false);
    }
  };

  // Determine whether to show recent searches
  const showRecentSearches = isSearchFocused && searchTerm.length === 0 && getRecentSearches().length > 0;

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
            <img
              src={logoImage}
              alt="CineVerse Logo"
              className="h-10 sm:h-12 lg:h-14 w-auto hover:scale-105 transition-transform"
              data-testid="logo-image"
            />
          </Link>

          {/* Desktop Navigation - Middle */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-lg font-medium transition-colors hover:text-primary ${location === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
                  }`}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar, Theme Toggle & Auth - Right */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search Bar */}
            <div className="hidden sm:block relative max-w-sm" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search movies, TV shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={handleSearchFocus}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      // Save search term to recent searches
                      addRecentSearch(searchTerm.trim());
                      setRecentSearchesKey(prev => prev + 1);
                      setIsSearchVisible(true);
                    }
                  }}
                  className="w-full px-4 py-2 pl-10 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              </div>

              <SearchDropdown
                key={recentSearchesKey}
                results={searchResults?.results || []}
                isVisible={isSearchVisible && searchTerm.length >= 3}
                onItemClick={handleSearchResultClick}
                showRecentSearches={showRecentSearches}
                onRecentSearchClick={handleRecentSearchClick}
                onRemoveRecentSearch={handleRemoveRecentSearch}
              />
            </div>

            {/* Mobile Search Icon/Bar */}
            <div className="sm:hidden relative" ref={searchRef}>
              {!isMobileSearchExpanded ? (
                <button
                  onClick={handleMobileSearchToggle}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  data-testid="mobile-search-toggle"
                >
                  <Search className="h-5 w-5" />
                </button>
              ) : (
                <div className="fixed inset-0 bg-background z-50 flex flex-col">
                  <div className="flex items-center p-4 border-b border-border">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search movies, TV shows..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={handleSearchFocus}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchTerm.trim()) {
                            addRecentSearch(searchTerm.trim());
                            setRecentSearchesKey(prev => prev + 1);
                            setIsSearchVisible(true);
                          }
                        }}
                        className="w-full px-4 py-3 pl-12 pr-4 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-lg"
                        data-testid="mobile-search-input"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (searchTerm.trim()) {
                            addRecentSearch(searchTerm.trim());
                            setRecentSearchesKey(prev => prev + 1);
                            setIsSearchVisible(true);
                          }
                        }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-accent rounded"
                      >
                        <Search className="text-muted-foreground w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={handleMobileSearchToggle}
                      className="ml-4 p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <SearchDropdown
                      key={recentSearchesKey}
                      results={searchResults?.results || []}
                      isVisible={isSearchVisible && searchTerm.length >= 3}
                      onItemClick={handleSearchResultClick}
                      showRecentSearches={showRecentSearches}
                      onRecentSearchClick={handleRecentSearchClick}
                      onRemoveRecentSearch={handleRemoveRecentSearch}
                    />
                  </div>
                </div>
              )}
            </div>

            <ThemeToggle />

            {/* Auth */}
            {!user ? (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition"
                >
                  Login
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent"
                  title="Open Dashboard"
                >
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt={profile.name || 'User'}
                      className="w-9 h-9 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center">
                      {(profile?.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col leading-none text-left">
                    <span className="text-sm font-medium truncate max-w-[140px]">{profile?.name || user.email?.split('@')[0] || 'User'}</span>
                  </div>
                </button>
              </div>
            )}

            <button
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 py-4 border-t border-border">
            <div className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-2 text-lg font-medium transition-colors hover:text-primary ${location === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
              {/* Mobile auth buttons */}
              {!user ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                  className="w-full mt-2 px-3 py-2 rounded bg-primary text-primary-foreground"
                >
                  Login
                </button>
              ) : (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
                  className="w-full mt-2 px-3 py-2 rounded border hover:bg-accent"
                >
                  Dashboard
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
