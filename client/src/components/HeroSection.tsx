import { useEffect, useMemo, useRef, useState } from 'react';
import heroImage from '@assets/CineVerseMain_1757144469037.png';

export function HeroSection() {
  const fullText = useMemo(
    () => 'Welcome to CineVerse',
    []
  );
  const [display, setDisplay] = useState('');
  const indexRef = useRef(0);
  const deletingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const typeSpeed = 100; // ms
    const deleteSpeed = 40; // ms
    const pauseAfterComplete = 5000; // ms

    const tick = () => {
      const i = indexRef.current;
      const deleting = deletingRef.current;

      if (!deleting) {
        const next = Math.min(i + 1, fullText.length);
        indexRef.current = next;
        setDisplay(fullText.slice(0, next));
        if (next === fullText.length) {
          // pause then start deleting
          timerRef.current = window.setTimeout(() => {
            deletingRef.current = true;
            timerRef.current = window.setTimeout(tick, deleteSpeed);
          }, pauseAfterComplete);
        } else {
          timerRef.current = window.setTimeout(tick, typeSpeed);
        }
      } else {
        const next = Math.max(i - 1, 0);
        indexRef.current = next;
        setDisplay(fullText.slice(0, next));
        if (next === 0) {
          deletingRef.current = false;
          timerRef.current = window.setTimeout(tick, typeSpeed);
        } else {
          timerRef.current = window.setTimeout(tick, deleteSpeed);
        }
      }
    };

    // start the loop
    timerRef.current = window.setTimeout(tick, typeSpeed);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [fullText]);

  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center hero-bg"
      style={{ backgroundImage: `url(${heroImage})` }}
      data-testid="hero-section"
    >
      {/* Background overlay for text readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 whitespace-nowrap">
          <span className="hero-gradient-text" data-testid="hero-title">
            {display}
            <span className="inline-block w-[1ch] ml-1 align-baseline animate-pulse">|</span>
          </span>
        </h1>
        <p
          className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
          data-testid="hero-description"
        >
          Discover trending movies, TV shows, and web series from around the world
        </p>
      </div>
    </section>
  );
}
