import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Series() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Series</h1>
        <p className="text-muted-foreground">Coming soon: TV shows listing, filters and categories.</p>
      </main>
      <Footer />
    </div>
  );
}
