import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Movies() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Movies</h1>
        <p className="text-muted-foreground">Coming soon: filters, categories and all movies listing.</p>
      </main>
      <Footer />
    </div>
  );
}
