
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-16 h-8 rounded-full border-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
        theme === 'dark' 
          ? 'bg-slate-700 border-slate-600' 
          : 'bg-yellow-100 border-yellow-300'
      }`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      data-testid="theme-toggle"
    >
      {/* Toggle circle */}
      <div
        className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 ease-in-out transform ${
          theme === 'dark' 
            ? 'translate-x-8 bg-slate-300' 
            : 'translate-x-0.5 bg-yellow-400'
        }`}
      />
      
      {/* Sun icon */}
      <Sun 
        className={`absolute left-1 top-1 w-4 h-4 text-yellow-600 transition-all duration-300 ${
          theme === 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        }`} 
      />
      
      {/* Moon icon */}
      <Moon 
        className={`absolute right-1 top-1 w-4 h-4 text-slate-400 transition-all duration-300 ${
          theme === 'light' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        }`} 
      />
      
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
