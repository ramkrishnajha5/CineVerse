import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CheckCircle, ExternalLink, Gamepad2, Film } from 'lucide-react';

export default function About() {
  const movieFeatures = [
    'Explore trending movies and TV shows updated daily',
    'Discover regional content from multiple film industries',
    'Watch popular trailers and teasers',
    'Access detailed information about cast, crew, and storylines',
    'Get personalized recommendations based on your interests',
  ];

  const gameFeatures = [
    'Discover popular games across all platforms',
    'Browse top-rated titles with Metacritic scores',
    'Find new releases from the last 90 days',
    'Explore games by genre: Action, RPG, Adventure',
    'View screenshots, trailers, and similar games',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-center mb-12 gradient-text">
              About CineVerse
            </h1>

            {/* Movies Section */}
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Film className="w-7 h-7 text-primary" />
                  <h2 className="text-2xl font-semibold">Explore the World of Cinema</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  CineVerse is your ultimate gateway to discovering movies, TV shows, and web series
                  from around the globe. Our platform brings you the latest trending content, popular
                  releases, and hidden gems from Hollywood, Bollywood, Tollywood, and beyond.
                </p>

                <h3 className="text-xl font-semibold mb-4">Our Features:</h3>
                <ul className="space-y-3">
                  {movieFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We believe that great stories transcend boundaries. Our mission is to make cinema
                  accessible to everyone by providing a comprehensive platform where film enthusiasts
                  can discover, explore, and enjoy content from diverse cultures and languages.
                </p>

                <h3 className="text-xl font-semibold mb-4">Why Choose CineVerse?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our platform combines cutting-edge technology with a passion for storytelling to
                  deliver an unmatched discovery experience. Whether you're looking for the latest
                  blockbusters, indie gems, or regional masterpieces, CineVerse has something for
                  every movie lover.
                </p>
              </div>
            </div>

            {/* GameVerse Section */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <Gamepad2 className="w-7 h-7 text-primary" />
                <h2 className="text-2xl font-semibold">GameVerse — Discover Games</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    GameVerse is our dedicated games section, bringing you a comprehensive database of
                    video games across all platforms. Whether you're a PC gamer, console enthusiast, or
                    mobile player, GameVerse helps you discover your next favorite game.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">GameVerse Features:</h3>
                  <ul className="space-y-2">
                    {gameFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-primary mt-1 mr-2 flex-shrink-0" />
                        <span className="text-muted-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* API Attribution Section */}
            <div className="bg-muted/50 rounded-lg p-8 mb-12">
              <h2 className="text-2xl font-semibold text-center mb-8">Powered by Industry Leaders</h2>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12">
                {/* TMDB */}
                <div className="text-center">
                  <div className="w-32 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <span className="font-bold text-primary text-xl">TMDb</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Movie and TV data provided by<br />
                    <strong>The Movie Database (TMDb)</strong>
                  </p>
                  <a
                    href="https://www.themoviedb.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 text-sm mt-2"
                  >
                    Visit TMDb <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                {/* YouTube */}
                <div className="text-center">
                  <div className="w-32 h-16 bg-red-600/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <div className="text-red-600 text-3xl">📺</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Trailers and video content<br />
                    <strong>powered by YouTube</strong>
                  </p>
                </div>

                {/* RAWG */}
                <div className="text-center">
                  <div className="w-32 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <span className="font-bold text-primary text-xl">RAWG</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Games data provided by<br />
                    <strong>RAWG Video Games Database</strong>
                  </p>
                  <a
                    href="https://rawg.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 text-sm mt-2"
                  >
                    Visit RAWG <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                CineVerse is a fan-made project for educational and entertainment purposes.
              </p>
              <p>
                This product uses the TMDb API and RAWG API but is not endorsed or certified by TMDb or RAWG.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
