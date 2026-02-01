# Project Summary: Cloud OpenGeoMetadata React

## Introduction

Cloud OpenGeoMetadata React is a browser-based geospatial metadata discovery application that enables users to search, filter, and explore geospatial resources from institutions worldwide. The application provides access to thousands of maps, datasets, imagery collections, web services, and other geographic information resources through an intuitive interface.

### Purpose

The application serves as a discovery portal for geospatial metadata, allowing researchers, librarians, GIS professionals, and the general public to:

- Search geospatial resources by keywords, location, and metadata attributes
- Filter results using faceted search across multiple dimensions (resource type, provider, subject, theme, format, etc.)
- View resources through interactive map interfaces and specialized viewers
- Access download links and service endpoints for discovered resources
- Explore geographic coverage through map-based interactions

### What Users Can Find

The catalog contains diverse geospatial resources categorized into several resource classes:

- **Maps**: Scanned historical maps, atlases, and cartographic materials
- **Datasets**: Vector and raster datasets with geographic information
- **Imagery**: Satellite imagery, aerial photography, and remote sensing data
- **Web Services**: WMS, WFS, and other OGC-compliant web services
- **Collections**: Curated sets of related geospatial resources
- **Websites**: Geospatial portals and information resources

Each resource includes rich metadata such as title, description, creator, publisher, provider, geographic coverage, subject classifications, temporal information, and access details.

## Technical Specifications

### Core Architecture

Cloud OpenGeoMetadata React is a modern single-page application (SPA) built with a fully client-side architecture. No backend server is required for data queries or search operations.

**Technology Stack:**

- **React 18.3.1**: Component-based UI framework with functional components and hooks
- **TypeScript 5.7.2**: Static typing for enhanced code quality and developer experience
- **Vite 6.0.3**: Build tool and development server with fast HMR (Hot Module Replacement)
- **Tailwind CSS 3.4.17**: Utility-first CSS framework for styling
- **DuckDB-WASM 1.29.0**: In-browser SQL query engine for data analytics

**Testing Stack:**

- **Vitest 2.1.8**: Unit and integration testing framework
- **Playwright 1.49.0**: End-to-end testing with browser automation
- **@axe-core**: Accessibility testing and WCAG compliance validation
- **@testing-library/react**: React component testing utilities

### DuckDB-WASM Query Engine

The application leverages DuckDB-WASM to execute SQL queries entirely in the browser without requiring a backend database server.

**Initialization Process:**

1. **Bundle Loading**: DuckDB-WASM bundle loaded from jsDelivr CDN
2. **Worker Creation**: Web Worker instantiated with DuckDB main worker script
3. **Database Instantiation**: Database initialized with main module and pthread worker
4. **Extension Loading**: Two extensions loaded via SQL:
   - `httpfs`: Enables reading files over HTTP/HTTPS
   - `spatial`: Provides geospatial functions (ST_Intersects, ST_GeomFromWKB, etc.)
5. **View Creation**: Parquet view created using: `CREATE VIEW parquet_data AS SELECT * FROM read_parquet(url)`

**Connection Management:**

- Single connection created per application session (`useDuckDB` hook)
- Connection passed as props to page components
- Cleanup on component unmount prevents memory leaks

**Query Performance:**

- Typical queries execute in 50-200ms
- Parquet file accessed via HTTP range requests (on-demand loading)
- No full file download required
- Facet queries execute in parallel for optimal performance

### Data Source: Parquet Files

**Location:**
```
https://pul-tile-images.s3.us-east-1.amazonaws.com/cloud.parquet
```

**Storage:** Amazon S3 bucket (us-east-1 region)

**Format:** Apache Parquet columnar format with the following key characteristics:

- Efficient columnar storage with compression
- Supports nested data structures (arrays via DuckDB LIST type)
- HTTP range request compatible for partial reads
- Spatial data stored as Well-Known Binary (WKB) geometry

**Schema Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique resource identifier |
| title | String | Resource title |
| description | Array[String] | Descriptive text (may have multiple values) |
| creator | Array[String] | Content creators |
| location | Array[String] | Place names |
| publisher | Array[String] | Publishing organizations |
| provider | String | Institutional provider |
| access_rights | String | Access restrictions or permissions |
| resource_class | Array[String] | High-level categorization (Maps, Datasets, etc.) |
| resource_type | Array[String] | Specific resource types |
| subject | Array[String] | Subject classifications |
| theme | Array[String] | Thematic categories |
| format | String | File format or media type |
| temporal | Array[String] | Temporal coverage information |
| index_year | Array[Number] | Years indexed |
| modified | String | Last modification date |
| identifier | Array[String] | Alternative identifiers |
| thumbnail | String | URL to thumbnail image |
| geojson | String | GeoJSON representation of coverage area |
| geometry | WKB | Well-Known Binary geometry |
| references | String | JSON string containing service URLs |
| wxs_identifier | String | WMS/WFS layer identifier |

**References Field Structure:**

The `references` field contains a JSON string with URLs for various services and viewers:

```json
{
  "http://iiif.io/api/presentation#manifest": "https://example.com/manifest.json",
  "http://iiif.io/api/image": "https://example.com/iiif/image-id",
  "http://www.opengis.net/def/serviceType/ogc/wms": "https://example.com/wms",
  "https://github.com/cogeotiff/cog-spec": "https://example.com/image.tif",
  "https://github.com/protomaps/PMTiles": "https://example.com/tiles.pmtiles",
  "http://schema.org/downloadUrl": "https://example.com/download.zip"
}
```

### Hash-Based Router

The application uses a custom hash-based router implementation (no React Router dependency) to manage client-side navigation and maintain search state in the URL.

**Route Structure:**

- Home: `/#/`
- Search: `/#/search?q=term&resource_class=Maps&page=2`
- Item Detail: `/#/item/{id}`

**Router Functions:**

- `parseHash()`: Parses current URL hash into route information
- `navigate(path)`: Changes browser location to new hash path
- `buildSearchUrl(params)`: Constructs search URL from parameters object
- `updateSearchParams(newParams)`: Updates current URL with new search parameters
- `toggleFilter(field, value, isActive)`: Adds or removes filter values
- `clearFilters()`: Removes all filters while preserving query and bbox

**URL as State:**

Query parameters serve as the single source of truth for search state:
- Search term (`q`)
- Geographic bounding box (`bbox`)
- Facet filters (field names with comma-separated values)
- Pagination (`page`)

Changes to URL parameters trigger `useEffect` hooks that re-execute queries, enabling shareable and bookmarkable search states.

### Viewer Libraries

The application supports multiple viewer types for different content formats:

**IIIF Viewer (@samvera/clover-iiif 3.3.2):**
- Displays IIIF Presentation API manifests
- Supports IIIF Image API endpoints
- Provides zoom, pan, and multi-page navigation
- Component: `IIIFViewer.tsx`

**WMS Viewer (OpenLayers 10.7.0):**
- Renders OGC Web Map Service layers
- Uses OpenLayers map library
- Overlays result geometry as GeoJSON layer
- Component: `WMSViewer.tsx`

**Cloud Optimized GeoTIFF Viewer (OpenLayers):**
- Displays COG (Cloud Optimized GeoTIFF) imagery
- Uses WebGL renderer for performance
- Supports large raster files via HTTP range requests
- Component: `COGViewer.tsx`

**PMTiles Viewer (ol-pmtiles 2.0.2):**
- Displays PMTiles vector tile archives
- Integrates PMTiles protocol with OpenLayers
- Efficient vector tile streaming
- Component: `PMTilesViewer.tsx`

**Location Map (Leaflet 1.9.4):**
- Simple map showing resource geographic coverage
- Displays GeoJSON geometry on OpenStreetMap basemap
- Used on item detail page sidebar
- Component: `LocationMap.tsx`

**Viewer Lifecycle:**

All map viewers implement proper cleanup to prevent memory leaks:
- OpenLayers: `map.setTarget(null)` on unmount
- Leaflet: `map.remove()` on unmount
- Viewers lazy-initialized with `setTimeout` to ensure DOM readiness

### Build Configuration

**Vite Configuration Requirements:**

DuckDB-WASM requires specific Vite configuration:

```javascript
optimizeDeps: {
  exclude: ['@duckdb/duckdb-wasm'],  // Prevent optimization
  esbuildOptions: {
    target: 'esnext',  // Required for WASM
  },
}
```

**CORS Headers for SharedArrayBuffer:**

Development server must send specific headers for DuckDB-WASM to function:

```javascript
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'credentialless',
  },
}
```

These headers enable `SharedArrayBuffer` support required by DuckDB-WASM workers.

**Path Aliases:**

- `@/` maps to `./src/` for cleaner imports

## Page Descriptions

### Home Page (`/#/`)

**File:** `src/pages/HomePage.tsx`

**Primary Purpose:**

The home page serves as the application entry point and provides two main pathways for users to begin exploring the catalog: keyword search and browsing by resource class.

**Components and Layout:**

**Hero Section:**
- Application title: "Search OpenGeoMetadata"
- Descriptive tagline explaining the catalog's scope
- Centered layout with maximum width constraint for readability

**Search Interface:**
- Location Search Input (left): Autocomplete dropdown powered by Nominatim geocoding API
  - Accepts location names (cities, states, countries)
  - Debounced input (250ms) to reduce API calls
  - Filters out natural features (rivers, mountains) for more relevant results
  - Selecting a location navigates to search page with bounding box filter
  - Dropdown shows up to 10 results with place name, type, and full address
- Text Search Input (center): Keyword search field
  - Searches across title fields using case-insensitive matching
  - Placeholder: "Search for maps, data, imagery..."
  - Icon: magnifying glass SVG
- Search Button (right): Submits search and navigates to search page

**Browse by Resource Class:**
- Section heading: "Browse by Resource Class"
- Grid display of resource class cards showing:
  - Class name (Maps, Datasets, Imagery, Web Services, Collections, Websites)
  - Count of resources in that class
  - Icon representing the class (determined by `getResourceClassIcon` function)
- "Browse All" button to view all resources without filters
- Data loaded on component mount via DuckDB aggregation query:
  ```sql
  SELECT unnested_value as name, COUNT(*) as count
  FROM parquet_data
  CROSS JOIN UNNEST(resource_class) as t(unnested_value)
  GROUP BY unnested_value
  ORDER BY count DESC, unnested_value ASC
  ```

**Behavior:**

- On mount: Executes resource class aggregation query to populate browse grid
- Location selection: Geocodes location to bounding box, navigates to search page with `bbox` parameter
- Text search submission: Navigates to search page with `q` parameter
- Resource class click: Navigates to search page with `resource_class` filter active
- Browse all click: Navigates to search page with no filters

**State Management:**

- `query`: Current text search input value
- `resourceClasses`: Array of resource class names with counts and icons
- `isLoadingClasses`: Loading state for initial query

**Performance Tracking:**

Query execution time tracked and reported to parent via `onQueryTime` prop callback.

### Search Page (`/#/search`)

**File:** `src/pages/SearchPage.tsx`

**Primary Purpose:**

The search page is the core interface for discovering resources through faceted search, geographic filtering, and keyword queries. It displays search results with interactive maps, faceted filters, and pagination.

**Layout Structure:**

The page uses a responsive layout with several distinct sections:

1. Map view (full width, top)
2. Search header (query input and result count)
3. Active filters display (removable filter chips)
4. Two-column layout:
   - Left sidebar: Facet panels (25% width on large screens)
   - Main content: Results grid and pagination (75% width)

**Search Header Component:**

- Text input field for keyword search
- Updates URL `q` parameter on change
- Shows placeholder when no query entered
- Clear button to remove search term

**Interactive Map Component:**

- Displays all search results as map markers
- Uses Leaflet with OpenStreetMap tiles
- Markers show resource locations from `geojson` field
- Click marker to navigate to item detail page
- Draw rectangle tool for geographic filtering:
  - User can draw bounding box on map
  - Updates URL with `bbox` parameter
  - Triggers query re-execution with spatial filter
- Clear bbox button when geographic filter is active

**Active Filters Component:**

- Displays all currently active facet filters as removable chips
- Each chip shows: `{field label}: {value}`
- Click X icon to remove individual filter
- "Clear All Filters" button removes all facets (preserves query and bbox)
- Only visible when filters are active

**Facet Panel Sidebar:**

Displays collapsible facet panels for each facetable field:

- **Resource Class** (array field)
- **Resource Type** (array field)
- **Place** (location array field)
- **Provider** (scalar field)
- **Access Rights** (scalar field)
- **Subject** (array field)
- **Theme** (array field)
- **Format** (scalar field)

Each facet panel includes:
- Field label with chevron icon (expand/collapse)
- Loading spinner when data is being fetched
- List of values with counts (e.g., "Maps (1,234)")
- Checkbox for each value (checked = filter active)
- Maximum 20 values per facet (sorted by count descending)

**Facet Loading Behavior:**

Facets use lazy loading to improve performance:
- Panels collapsed by default (except those with active filters)
- Facet data fetched only when panel is expanded
- All expanded facets load in parallel via `Promise.all`
- Facets reload when search parameters change (new filters invalidate old counts)
- Loading state tracked per facet in `loadedFacets` state object

**Results Grid Component:**

- Card-based layout with responsive grid (1-3 columns depending on screen size)
- Each result card displays:
  - Thumbnail image (if available)
  - Title (linked to item detail page)
  - Provider name
  - Access rights badge
  - Truncated description
- Cards sorted by relevance (database order)
- Click anywhere on card to navigate to item detail page

**Pagination Component:**

- Appears when results exceed page size (10 items per page)
- Shows: "Showing 1-10 of 1,234 results"
- Previous/Next buttons for navigation
- Page number buttons (current, adjacent, first, last)
- Ellipsis (...) for skipped page ranges
- Updates URL `page` parameter on navigation
- Returns to page 1 when filters change

**Query Execution Flow:**

When URL parameters change (via `useEffect` dependency on `query` object):

1. Execute main search query with filters, bbox, pagination:
   ```sql
   SELECT * FROM parquet_data
   WHERE [filter conditions]
   ORDER BY title
   LIMIT 10 OFFSET 0
   ```

2. Execute count query for pagination:
   ```sql
   SELECT COUNT(*) FROM parquet_data
   WHERE [filter conditions]
   ```

3. Clear loaded facets cache (counts may have changed)

4. When facet panel expanded, execute facet aggregation query:
   - For array fields: `CROSS JOIN UNNEST(field)` to flatten values
   - For scalar fields: `GROUP BY field`
   - Apply current filters except the facet's own field
   - Return top 20 values with counts

**Filter Construction:**

Filters are applied using DuckDB SQL:
- Text search: `title ILIKE '%term%'` (case-insensitive partial match)
- Geographic: `ST_Intersects(geometry, 'POLYGON((...))'::GEOMETRY)`
- Array fields: `list_contains(field, 'value')`
- Multiple values: `(list_contains(field, 'value1') OR list_contains(field, 'value2'))`
- Scalar fields: `field = 'value'` or `field IN ('value1', 'value2')`

**State Management:**

- `results`: Current page of search results
- `totalResults`: Total count matching filters
- `facets`: Object mapping field names to array of facet values with counts
- `expandedFacets`: Object tracking which facet panels are expanded
- `loadedFacets`: Object tracking which facets have been loaded
- `isLoading`: Loading state for main search query

**Performance Optimization:**

- Facets loaded on-demand rather than all upfront
- Parallel facet queries when multiple panels expanded
- Debounced search input to reduce query frequency
- Query history tracking for performance monitoring

### Item Detail Page (`/#/item/{id}`)

**File:** `src/pages/ItemDetail.tsx`

**Primary Purpose:**

The item detail page displays comprehensive metadata and interactive viewers for a single geospatial resource. Users can explore the resource through various visualization interfaces and access download links.

**Layout Structure:**

1. Navigation header with back button
2. Title heading (h1)
3. Viewer section (full width, stacked vertically)
4. Two-column content layout:
   - Left column (66%): Metadata card
   - Right column (33%): Location map and downloads card

**Navigation Header:**

- Back button with left arrow icon
- Text: "Back to Search"
- Navigates to previous page using `window.history.back()`
- Focus ring for keyboard accessibility

**Title Display:**

- Large heading (text-3xl) showing resource title
- Extracted from `title` field in metadata record

**Viewer Section:**

Displays zero or more viewers based on available references in the metadata. Viewers are stacked vertically and appear in the following priority order:

1. **IIIF Viewer** (if `iiifManifest` or `iiifImage` URL present):
   - Preferred viewer for scanned maps and manuscripts
   - Loads Clover IIIF viewer component
   - Supports zoom, pan, and page navigation
   - Full viewer interface for high-resolution imagery

2. **WMS Viewer** (if `wms` URL present):
   - Displays OGC Web Map Service layer
   - OpenLayers map with WMS layer
   - Overlays resource geometry as blue polygon
   - Zoom to fit geometry extent on load
   - Interactive map controls (zoom, pan)

3. **COG Viewer** (if `cog` URL present):
   - Displays Cloud Optimized GeoTIFF
   - OpenLayers with GeoTIFF source and WebGL renderer
   - Efficient streaming of large raster files
   - Overlays resource geometry
   - Suitable for aerial imagery and satellite data

4. **PMTiles Viewer** (if `pmtiles` URL present):
   - Displays PMTiles vector tile archive
   - OpenLayers with PMTiles protocol adapter
   - Efficient vector tile rendering
   - Overlays resource geometry
   - Suitable for large vector datasets

Multiple viewers can appear if the resource has multiple reference types.

**Metadata Card (Left Column):**

Displays all metadata fields configured for item detail display (from `fieldsConfig.ts`):

- Description (array, may have multiple paragraphs)
- Creator (array, comma-separated if multiple)
- Place (location array)
- Publisher (array)
- Provider (scalar)
- Access Rights (scalar)
- Resource Class (array)
- Resource Type (array)
- Subject (array)
- Theme (array)
- Format (scalar)
- Temporal (array)

Each field displays:
- Field label (bold)
- Field value(s)
- Array fields display all values joined by commas or as separate lines
- Empty fields are omitted from display

**Location Map (Right Column):**

- Small Leaflet map showing resource coverage
- GeoJSON geometry parsed and displayed as polygon or point
- Zoomed to fit geometry bounds
- OpenStreetMap basemap
- Non-interactive (display-only)
- Fixed height with scrollable container

**Downloads Card (Right Column):**

Appears only if `download` URL exists in references.

Displays:
- Card heading: "Downloads"
- Format badge (if format field present)
- Download links:
  - Single URL: One download button
  - Array of URLs: Multiple labeled buttons
- External link icon on buttons
- Opens downloads in new browser tab

**Data Loading:**

On component mount:
1. Execute query to fetch single record by ID:
   ```sql
   SELECT * FROM parquet_data
   WHERE id = '{itemId}'
   LIMIT 1
   ```
2. Parse all fields into `MetadataRecord` object
3. Parse `references` JSON string into `ParsedReferences` object
4. Initialize appropriate viewers based on available URLs
5. Parse `geojson` for location map display

**Error States:**

- Loading state: Shows "Loading..." message while querying
- Not found: Shows "Item not found" message with back button
- Query error: Shows error message with back button

**State Management:**

- `item`: Full metadata record for the resource
- `isLoading`: Loading state during initial query
- `error`: Error message if query fails

**Viewer Cleanup:**

All viewers implement cleanup on component unmount to prevent memory leaks:
- OpenLayers viewers: Call `map.setTarget(null)` in cleanup function
- Leaflet viewers: Call `map.remove()` in cleanup function
- IIIF viewer: Clover library handles internal cleanup

## Important Application Behaviors

### URL State Management

**Single Source of Truth:**

The URL serves as the canonical source of truth for all search-related state. This design enables:
- Shareable search results via URL copying
- Bookmarkable searches
- Browser back/forward button support
- Deep linking to specific search configurations

**State Synchronization:**

- URL changes trigger `useEffect` hooks via `useRouter()` hook
- Effects re-execute queries when URL parameters change
- Component state derived from URL, not stored separately
- Page component receives parsed `SearchParams` object via props

**Parameter Encoding:**

- Text search: `?q=keyword`
- Geographic filter: `?bbox=west,south,east,north`
- Facet filters: `?resource_class=Maps,Datasets`
- Pagination: `?page=2`
- Multiple parameters: `?q=keyword&resource_class=Maps&page=2`

**Filter Reset Behavior:**

- Adding/removing facet filter resets to page 1
- Clearing all filters preserves query term and bbox
- Changing query term resets to page 1

### Faceted Search with Dynamic Counts

**Facet Aggregation:**

Facets display counts that reflect current search context:
- Counts update when query changes
- Counts update when bbox filter applied
- Counts update when other facets selected
- Each facet shows counts excluding its own filter (allows users to see "what if" scenarios)

**Array Field Handling:**

Array fields require special SQL handling:
```sql
CROSS JOIN UNNEST(field_name) as t(unnested_value)
```

This flattens array values so each value appears in a separate row for counting.

**Scalar Field Handling:**

Scalar fields use simple GROUP BY:
```sql
GROUP BY field_name
```

**Facet Limits:**

- Maximum 20 values displayed per facet (configurable via `MAX_FACET_VALUES`)
- Values sorted by count descending, then alphabetically
- Top values likely to be most relevant

**Lazy Loading:**

Facets load on-demand to improve initial page load:
- Collapsed facets don't execute queries
- Expanding a facet triggers its aggregation query
- Multiple expanded facets load in parallel
- Loaded facets cached until search parameters change

### Geographic Filtering

**Bounding Box Creation:**

Users create geographic filters by:
1. Drawing rectangle on search page map
2. Selecting location from home page location search
3. Manually editing URL bbox parameter

**Bounding Box Storage:**

Format: `west,south,east,north` (longitude, latitude coordinates)

Example: `-122.5,37.7,-122.3,37.9` (San Francisco area)

**Spatial Query Construction:**

Bounding box converted to WKT (Well-Known Text) polygon:
```sql
WHERE ST_Intersects(
  geometry,
  'POLYGON((west north, west south, east south, east north, west north))'::GEOMETRY
)
```

Note: Polygon coordinates use longitude/latitude order, not latitude/longitude.

**Bounding Box Display:**

- Active bbox shows as removable filter chip
- Map displays bbox as semi-transparent rectangle overlay
- Clear button removes spatial filter from URL

**Coordinate System:**

All geometries use WGS84 (EPSG:4326) coordinate reference system.

### Query Performance Tracking

**Performance Monitoring:**

The application tracks query execution times for monitoring and optimization:

- Each query measured using `performance.now()`
- Query details recorded: label, SQL text, execution time
- History maintained in `useQueryHistory` context
- Overall page load time calculated (includes all queries)
- Callback to parent component: `onQueryTime(milliseconds)`

**Query Types Tracked:**

- Resource class aggregation (home page)
- Main search query (search page)
- Count query for pagination (search page)
- Facet aggregation queries (one per expanded facet)
- Item detail query (item page)

**History Display:**

Query history displayed in developer-friendly format for debugging:
- Query label
- SQL text
- Execution time in milliseconds
- Accessible via context provider

### Memory Management

**Viewer Cleanup:**

All map viewers implement proper cleanup to prevent memory leaks:

```typescript
useEffect(() => {
  // Initialize viewer
  const map = new Map({...});

  return () => {
    // Cleanup on unmount
    map.setTarget(null); // OpenLayers
    // or
    map.remove(); // Leaflet
  };
}, [dependencies]);
```

**Connection Cleanup:**

DuckDB connection closed on application unmount:

```typescript
return () => {
  if (conn) {
    conn.close().catch(console.error);
  }
};
```

**Event Listener Cleanup:**

React effects remove event listeners on cleanup:
- Location search click-outside handler
- Router hash change listeners
- Map interaction handlers

### SQL Injection Prevention

**User Input Sanitization:**

All user input escaped before insertion into SQL queries:

```typescript
function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}
```

Single quotes doubled to prevent SQL injection attacks.

**Safe Query Construction:**

Utility functions in `src/lib/queries.ts` handle sanitization:
- `buildSearchQuery()`: Escapes search terms and filter values
- `buildFacetQuery()`: Escapes filter values for facet queries

### Dark Mode Support

**Implementation:**

- Tailwind CSS `dark:` prefix for dark mode styles
- Respects system preference via `prefers-color-scheme` media query
- All components include dark mode styling
- Proper contrast ratios maintained for accessibility

**Color Scheme:**

- Light mode: Gray backgrounds, dark text
- Dark mode: Dark gray backgrounds, light text
- Primary accent: Blue (primary-600/primary-400)
- Consistent across all pages and components

### Accessibility Features

**Keyboard Navigation:**

- All interactive elements keyboard accessible
- Focus indicators visible on all controls
- Tab order follows logical reading order
- Skip links for screen readers (where applicable)

**ARIA Attributes:**

- Semantic HTML elements (`<nav>`, `<main>`, `<aside>`, `<article>`)
- ARIA labels for icon-only buttons
- ARIA roles for custom widgets (combobox, listbox, option)
- Screen reader text for hidden but important information

**Screen Reader Support:**

- Visually hidden headings for page structure (`sr-only` class)
- Alt text for meaningful images
- Icon-only buttons have aria-label attributes
- Status messages announced appropriately

**Axe-Core Validation:**

E2E tests include accessibility scanning:
- Automated WCAG compliance checking
- Reports violations with remediation guidance
- Run in development mode via Playwright tests

## User Flow Stories

### 1. Keyword Search for Historical Maps

**Scenario:** A historian wants to find historical maps of New York City.

**Steps:**
1. User lands on home page
2. Types "New York" in the text search input
3. Clicks "Search" button
4. Search page loads with results filtered by query term
5. User sees map with pins showing resource locations
6. User scans result cards showing map titles and thumbnails
7. User clicks on a result card for "1890 Map of Manhattan"
8. Item detail page loads showing:
   - High-resolution IIIF viewer with zoomable map image
   - Metadata including creator, publisher, date
   - Location map showing Manhattan coverage
   - Download button for full-resolution TIFF
9. User downloads the map file for research

### 2. Geographic Discovery via Location Search

**Scenario:** A GIS analyst needs datasets covering San Francisco.

**Steps:**
1. User lands on home page
2. Clicks in location search input
3. Types "San Francisco"
4. Dropdown appears with autocomplete suggestions
5. User selects "San Francisco, California, United States (city)"
6. Search page loads with bounding box filter applied
7. Map shows blue rectangle around San Francisco area
8. All results fall within the geographic bounds
9. User adds facet filter for "Datasets" resource class
10. Results narrow to only datasets in San Francisco area
11. User finds "San Francisco Building Footprints" dataset
12. Clicks result to view detail page with download link

### 3. Faceted Browse for Satellite Imagery

**Scenario:** A remote sensing researcher wants to browse available satellite imagery.

**Steps:**
1. User lands on home page
2. Clicks "Imagery" card in Browse by Resource Class section
3. Search page loads with "Resource Class: Imagery" filter active
4. User expands "Theme" facet panel
5. Facet loads showing themes like "Satellite", "Aerial", "Ortho"
6. User selects "Satellite" theme filter
7. Results update to show only satellite imagery
8. User expands "Provider" facet
9. Sees NASA, USGS, ESA as top providers
10. Selects "NASA" provider filter
11. Results narrow to NASA satellite imagery
12. User clicks on "Landsat 8 Scene" result
13. COG viewer displays the satellite image with interactive pan/zoom
14. Metadata shows temporal coverage and spectral bands

### 4. Multi-Criteria Exploration

**Scenario:** A librarian curates resources about climate change for students.

**Steps:**
1. User searches for "climate change" on home page
2. Search results show mix of maps, datasets, and reports
3. User expands "Subject" facet panel
4. Selects "Climate" from subject values
5. User expands "Access Rights" facet
6. Selects "Public" to find freely accessible resources
7. User expands "Format" facet
8. Selects "GeoTIFF" for downloadable raster data
9. Results now show public climate-related GeoTIFF files
10. User pages through results to find suitable resources
11. Bookmarks search URL to return later
12. Shares URL with students via course management system

### 5. WMS Service Discovery

**Scenario:** A web developer needs a WMS service for a mapping application.

**Steps:**
1. User searches for "land use" on home page
2. Search results display
3. User expands "Resource Class" facet
4. Selects "Web Services" filter
5. Results show only web service resources
6. User clicks on "State Land Use WMS Service"
7. Item detail page shows:
   - Interactive WMS viewer displaying the service
   - WMS endpoint URL in references
   - Layer identifier (wxs_identifier)
8. User copies WMS URL to integrate in their web application
9. Tests service by zooming and panning in the viewer

### 6. Refined Search with Pagination

**Scenario:** A researcher systematically reviews all historical aerial photographs.

**Steps:**
1. User browses all resources (clicks "Browse All" on home page)
2. Search page shows all resources, starting with page 1
3. User expands "Resource Type" facet
4. Selects "Aerial photograph" filter
5. Results show 234 total aerial photographs
6. Pagination shows "Showing 1-10 of 234 results"
7. User reviews first 10 results
8. Clicks "Next" button to view page 2
9. URL updates to include `?page=2`
10. Reviews second set of 10 results
11. Clicks page number "5" to jump ahead
12. Continues systematic review across all pages
13. Clicks specific result to examine metadata
14. Uses browser back button to return to same page of results

### 7. Clearing Filters to Broaden Results

**Scenario:** A user's initial search is too restrictive and finds no results.

**Steps:**
1. User searches for "topographic maps" with location "Iceland"
2. Adds filters: Resource Class "Maps", Format "GeoTIFF"
3. Search returns 0 results
4. User sees message "No results found. Try adjusting your search or filters."
5. User clicks "Clear All Filters" button
6. Search re-runs with only query term "topographic maps"
7. Results now show 45 topographic maps from various locations
8. User expands "Place" facet
9. Sees that Iceland has 2 results
10. Selects "Iceland" place filter
11. Views the 2 available Iceland topographic maps
12. Realizes GeoTIFF format was too restrictive
13. Clicks on first result to view details

### 8. Drawing Custom Geographic Area

**Scenario:** A planner needs resources covering a specific project area that doesn't match any named location.

**Steps:**
1. User goes directly to search page via navigation
2. Sees map showing global coverage
3. Zooms map to their region of interest (specific neighborhood)
4. Clicks "Draw Rectangle" button on map
5. Draws rectangle around 5-block project area
6. Map displays blue rectangle overlay
7. Results update to show only resources intersecting the area
8. Active filter chip shows "Geographic Filter" with X button
9. User finds 8 relevant resources for the project area
10. Reviews each result's coverage on the map
11. Identifies which resources have complete coverage of project area
12. Opens item detail pages for suitable resources

### 9. Discovering Related Resources

**Scenario:** A student finds one relevant map and wants to find similar resources.

**Steps:**
1. User searches for "Boston transit" on home page
2. Finds "Boston MBTA Transit Map 2020"
3. Clicks to view item detail page
4. Reviews metadata and notes:
   - Publisher: Massachusetts Bay Transportation Authority
   - Subject: Transportation, Public Transit
   - Theme: Infrastructure
5. User clicks browser back to return to search results
6. Expands "Publisher" facet
7. Selects "Massachusetts Bay Transportation Authority"
8. Finds 12 other maps from same publisher
9. Expands "Subject" facet
10. Selects "Transportation" to focus results
11. Discovers historical transit maps dating back to 1960s
12. Downloads multiple maps for timeline analysis

### 10. Accessing IIIF Manifest for Integration

**Scenario:** A digital humanities project needs IIIF manifests for a custom viewer.

**Steps:**
1. User searches for "medieval manuscripts"
2. Adds filter: Resource Class "Collections"
3. Finds "Medieval Cartography Collection"
4. Clicks to view item detail page
5. IIIF viewer loads showing manuscript pages
6. User needs the manifest URL for their project
7. Opens browser developer tools
8. Inspects network requests to find manifest URL
9. Alternatively, user notes the references field structure
10. Copies IIIF manifest URL from network inspector
11. Tests manifest URL in their custom IIIF viewer
12. Integrates manifest into digital humanities platform

---

## Summary

Cloud OpenGeoMetadata React provides a comprehensive, performant, and accessible interface for discovering geospatial resources. The fully client-side architecture powered by DuckDB-WASM eliminates backend infrastructure requirements while maintaining fast query performance. The combination of faceted search, geographic filtering, keyword search, and multiple viewer types supports diverse discovery workflows for researchers, librarians, developers, and the general public.
