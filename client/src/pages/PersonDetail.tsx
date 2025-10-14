import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Briefcase, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi } from '@/lib/tmdb';
import type { PersonDetail as PersonDetailType, CombinedCredits } from '@/types/tmdb';

export default function PersonDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const personId = parseInt(id || '0');

  const { data: person, isLoading: personLoading } = useQuery<PersonDetailType>({
    queryKey: ['/person', personId],
    queryFn: () => tmdbApi.getPersonDetails(personId),
    enabled: !!personId,
  });

  const { data: credits, isLoading: creditsLoading } = useQuery<CombinedCredits>({
    queryKey: ['/person', personId, 'combined_credits'],
    queryFn: () => tmdbApi.getPersonCombinedCredits(personId),
    enabled: !!personId,
  });

  if (personLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Skeleton className="h-8 w-32 mb-8" />
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Person Not Found</h1>
              <p className="text-muted-foreground mb-8">
                The person you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const age = person.birthday
    ? Math.floor((new Date().getTime() - new Date(person.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  // Combine and sort credits by popularity
  const allCredits = [
    ...(credits?.cast || []).map(c => ({ ...c, role: c.character || 'Actor' })),
    ...(credits?.crew || []).map(c => ({ ...c, role: c.job || 'Crew' })),
  ].sort((a, b) => b.popularity - a.popularity);

  const handleCreditClick = (credit: typeof allCredits[0]) => {
    if (credit.media_type === 'movie') {
      navigate(`/movie/${credit.id}`);
    } else {
      navigate(`/tv/${credit.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-8"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Picture */}
              <div className="lg:col-span-1">
                {person.profile_path ? (
                  <img
                    src={tmdbApi.getImageUrl(person.profile_path, 'w780')}
                    alt={person.name}
                    className="w-full rounded-lg shadow-xl"
                  />
                ) : (
                  <div className="aspect-[2/3] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-4xl">{person.name[0]}</span>
                  </div>
                )}

                {/* Quick Info */}
                <div className="mt-6 space-y-3">
                  {person.known_for_department && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-muted-foreground">Known For</div>
                        <div className="font-medium">{person.known_for_department}</div>
                      </div>
                    </div>
                  )}

                  {person.birthday && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-muted-foreground">Born</div>
                        <div className="font-medium">
                          {new Date(person.birthday).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {age && ` (${age} years old)`}
                        </div>
                      </div>
                    </div>
                  )}

                  {person.place_of_birth && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-muted-foreground">Place of Birth</div>
                        <div className="font-medium">{person.place_of_birth}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Person Information */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-pink-500 via-cyan-400 to-yellow-400 bg-clip-text text-transparent">
                    {person.name}
                  </h1>
                </div>

                {/* Biography */}
                {person.biography && (
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">Biography</h3>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      {person.biography.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {!person.biography && (
                  <div className="text-muted-foreground italic">
                    No biography available for {person.name}.
                  </div>
                )}
              </div>
            </div>

            {/* Known For / Filmography */}
            {!creditsLoading && allCredits.length > 0 && (
              <div className="mt-12">
                <h3 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-pink-500 via-cyan-400 to-yellow-400 bg-clip-text text-transparent">
                  Known For
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {allCredits.slice(0, 18).map((credit) => {
                    const title = credit.title || credit.name || 'Untitled';
                    const year = credit.release_date
                      ? new Date(credit.release_date).getFullYear()
                      : credit.first_air_date
                      ? new Date(credit.first_air_date).getFullYear()
                      : '';

                    return (
                      <div
                        key={`${credit.media_type}-${credit.id}`}
                        className="cursor-pointer group"
                        onClick={() => handleCreditClick(credit)}
                      >
                        <div className="bg-card border border-border rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                          {/* Poster */}
                          <div className="aspect-[2/3] relative overflow-hidden">
                            {credit.poster_path ? (
                              <img
                                src={tmdbApi.getImageUrl(credit.poster_path)}
                                alt={title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <span className="text-muted-foreground text-sm">No Image</span>
                              </div>
                            )}

                            {/* Rating Badge */}
                            {credit.vote_average > 0 && (
                              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{credit.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-3">
                            <h4 className="font-semibold text-sm mb-1 line-clamp-2 leading-tight">
                              {title}
                            </h4>
                            {year && (
                              <div className="text-xs text-muted-foreground mb-1">{year}</div>
                            )}
                            {credit.role && (
                              <div className="text-xs text-muted-foreground italic line-clamp-1">
                                as {credit.role}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
