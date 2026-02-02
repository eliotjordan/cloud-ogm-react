# Cloud OpenGeoMetadata React

A production-ready React + TypeScript application for searching and discovering geospatial metadata from institutions worldwide. Built with DuckDB-WASM for client-side SQL queries on Parquet data.

## Features

- **Client-side search**: DuckDB-WASM powers SQL queries directly in the browser
- **Semantic search**: AI-powered search by meaning using distilled embeddings
- **Geospatial discovery**: Interactive maps with Leaflet and OpenLayers
- **Advanced filtering**: Faceted search with dynamic filter counts
- **Multiple viewers**: IIIF, WMS, COG, and PMTiles support
- **Fully typed**: Built with TypeScript for type safety
- **Accessible**: WCAG compliant with axe-core validation
- **Well tested**: Comprehensive unit, integration, and E2E tests

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **DuckDB-WASM** for client-side analytics
- **Custom tokenizer** for semantic search embeddings
- **Leaflet & OpenLayers** for maps
- **Vitest** for unit/integration tests
- **Playwright** for E2E tests
- **axe-core** for accessibility testing

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

## Testing

### Unit & Integration Tests

```bash
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### End-to-End Tests

```bash
npm run test:e2e        # Headless mode
npm run test:e2e:ui     # Interactive UI
npm run test:e2e:headed # Headed mode
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Core libraries (DuckDB, routing)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── test/            # Test setup and E2E tests
└── styles/          # Global styles
```

## Architecture

- **Hash-based routing**: Client-side navigation with URL state
- **DuckDB-WASM**: Queries Parquet file from S3 on-demand
- **Reactive state**: URL parameters drive search state
- **Lazy viewers**: Map viewers initialized only when needed
- **Memory management**: Proper cleanup to prevent leaks

## Data Source

Parquet file: `https://pul-tile-images.s3.us-east-1.amazonaws.com/cloud.parquet`

The file contains geospatial metadata with fields for titles, descriptions, providers, geometries, and references to various web services (WMS, COG, PMTiles, IIIF).

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires SharedArrayBuffer support for DuckDB-WASM.

## License

Copyright © 2026 Cloud OpenGeoMetadata
