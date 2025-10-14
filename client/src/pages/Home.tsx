import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { TrendingSection } from '@/components/TrendingSection';
import { UpcomingMoviesSection } from '@/components/UpcomingMoviesSection';
import { PopularMoviesByRegion } from '@/components/PopularMoviesByRegion';
import { PopularTrailersSection } from '@/components/PopularTrailersSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <TrendingSection />
        <UpcomingMoviesSection />
        <PopularMoviesByRegion />
        <PopularTrailersSection />
      </main>
      <Footer />
    </div>
  );
}
