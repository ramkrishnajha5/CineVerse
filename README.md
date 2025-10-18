# CineVerse

Live: https://cineverse-966l.onrender.com

A modern movie and TV discovery web app with trailers, regional recommendations, watchlist and favourites, user dashboard, and Firebase-powered authentication and data. Built with React + Vite, Tailwind, shadcn/ui primitives, TMDB API proxy, and Firebase (Auth, Firestore, Storage).

## Features

- **Home & Discovery**
  - Trending movies/TV and anime
  - Popular trailers with inline YouTube embeds
  - Regional popular content 
  - Upcoming movies

- **Search & Details**
  - Instant search with dropdown 
  - Movie/TV detail pages with ratings, genres, storyline, box office
  - **Embedded YouTube trailer** plays on-site, shown before Cast & Crew
  - Cast & Crew with person pages
  - "More Like This" with smart regional/genre fallbacks

- **User Accounts**
  - Email/password and Google sign-in
  - OTP signup flow via server endpoints (send/verify)
  - Theme toggle (light/dark) with persistence
  - Fully theme-aware UI including Login page

- **Dashboard** 
  - Profile (name, gender, age, country, picture upload via Cloudinary)
  - Watchlist and Favourites management
  - **Delete Account**: requires re-authentication, deletes Auth user and all Firestore data (profile, watchlist, favourites)

- **Data & APIs**
  - TMDB API via server proxy
  - Firebase Auth + Firestore + Storage
  - Clear, user-friendly auth error messages

## Tech Stack

- React 18, Vite 5
- TypeScript
- Tailwind CSS + shadcn/ui primitives (Radix)
- TanStack Query
- Firebase (Auth, Firestore, Storage)
- Express server with Vite for API proxy
- Drizzle (configured) for potential server DB use

## Getting Started

### Prerequisites
- Node.js 18+

### Install
```bash
npm install
```

### Environment Variables
Create `.env.local` at project root with Vite-prefixed keys:

```
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Optional
VITE_FIREBASE_MEASUREMENT_ID=...
```

### Run (Dev)
```bash
npm run dev
```

### Build & Start (Prod)
```bash
npm run build
npm start
```

## Contributing

- Issues and PRs welcome. Please keep UI theme tokens and error messages consistent.

## License

MIT
