import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AnimeSection } from '@/components/AnimeSection';

export default function AnimePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <AnimeSection />
      </main>
      <Footer />
    </div>
  );
}
