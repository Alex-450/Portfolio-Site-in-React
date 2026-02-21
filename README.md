## Description

Personal portfolio site with a blog and film listings for Amsterdam/Haarlem cinemas.

## Features

- Personal blog with MDX support
- Film listings aggregated from local cinema RSS feeds:
  - LAB111
  - Kriterion
  - Eye Filmmuseum
  - Studio K
  - FilmHallen
  - The Movies
  - FilmKoepel
  - FC Hyena
- Film filtering by cinema, genre, director, day, and release year
- Watchlist functionality (stored in local storage)
- Dark mode support
- RSS feed and sitemap generation

## Tech Stack

- [Next.js](https://nextjs.org/) (React framework)
- [React Bootstrap](https://react-bootstrap.github.io/) (UI components)
- [MDX](https://mdxjs.com/) (blog posts)
- TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Fetch showtimes and build for production
- `npm run build:only` - Build without fetching showtimes
- `npm run deploy` - Deploy to GitHub Pages
- `npm run format` - Format code with Prettier
