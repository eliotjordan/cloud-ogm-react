# Cloud OpenGeoMetadata

A React application for searching and discovering geospatial metadata from institutions worldwide. Browse thousands of maps, datasets, imagery, and web services -- all queried client-side with no backend required.

## Features

- **Full-text and semantic search** across geospatial metadata records
- **Faceted filtering** by provider, resource class, theme, location, and more
- **Interactive maps** with geographic bounding box search
- **Multiple viewers** for IIIF manifests, WMS layers, Cloud Optimized GeoTIFFs, and PMTiles
- **Client-side analytics** powered by DuckDB-WASM querying Parquet data over HTTP
- **Accessible** interface with WCAG validation via axe-core

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Architecture

The application runs entirely in the browser. DuckDB-WASM loads a remote Parquet file from S3 using HTTP range requests, executes SQL queries client-side, and returns results as Apache Arrow tables. A hash-based router (`/#/search`, `/#/item/{id}`) manages navigation with URL parameters as the source of truth for search state.

Semantic search uses a distilled Model2Vec embedding model loaded on startup. Query embeddings are generated in the browser and compared against pre-computed document embeddings stored in the Parquet file using DuckDB's `list_dot_product()` function.

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## Testing

```bash
npm test              # Unit tests (Vitest)
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report

npm run lint          # Lint with eslint

npm run test:e2e      # E2E tests (Playwright, headless)
npm run test:e2e:ui   # E2E tests (interactive UI)
```

## Building and Deployment

```bash
npm run build         # Production build (type checks + Vite)
npm run preview       # Preview production build locally
```

### Hosting Requirements

The production build is a static site that can be served from any CDN or static hosting provider. Two requirements:

1. **CORS headers for SharedArrayBuffer**: DuckDB-WASM requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` response headers. Without these, DuckDB will fail to initialize.

2. **Data source access**: The application fetches a Parquet file and embedding model from S3 by default. To use a different data source, update the URLs in `src/lib/constants.ts`.

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- DuckDB-WASM for client-side SQL
- Leaflet and OpenLayers for maps
- Vitest and Playwright for testing
