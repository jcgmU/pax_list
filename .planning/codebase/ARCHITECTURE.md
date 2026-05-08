# Architecture

**Analysis Date:** 2026-05-07

## Pattern Overview

**Overall:** Client-Server with Stateless API + Client State Management

**Key Characteristics:**
- Next.js App Router for full-stack application (frontend + backend)
- Zustand for lightweight client-side state management
- Server-side PDF parsing via REST API endpoint
- Component-based UI with Tailwind CSS styling
- No database — stateless PDF processing and in-memory state

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render interactive cabin seat map visualization and flight details
- Location: `src/components/`
- Contains: React components (SeatMap, Dropzone), UI logic, event handlers
- Depends on: Zustand store, Lucide icons, html-to-image for export
- Used by: Page component (`src/app/page.tsx`)

**State Management Layer:**
- Purpose: Centralize and persist flight data, passenger manifest, and fleet selection
- Location: `src/store/useStore.ts`
- Contains: Zustand store with passenger records, flight metadata, selected aircraft config
- Depends on: Fleet configuration dictionary
- Used by: All client components (page, SeatMap, etc.)

**API Layer (Backend):**
- Purpose: Parse PDF flight manifests and extract structured passenger data
- Location: `src/app/api/parse/route.ts`
- Contains: POST endpoint handling multipart form data (PDF files), PDF text extraction, regex-based parsing logic
- Depends on: pdf-parse library
- Used by: Home page component via fetch POST

**Configuration Layer:**
- Purpose: Define aircraft fleet specifications (cabin layouts, seat configurations)
- Location: `src/config/fleet.ts`
- Contains: TypeScript interfaces (AircraftConfig, CabinConfig), FLEET_DICTIONARY with 3 aircraft types (Boeing 787-8, Airbus A320, A320neo)
- Depends on: Nothing (pure data)
- Used by: Zustand store, SeatMap component, page component

**Page/Routing Layer:**
- Purpose: Next.js App Router entry points for application structure
- Location: `src/app/`
- Contains: Root layout (`layout.tsx`), home page (`page.tsx`), API routes (`api/parse/route.ts`)
- Depends on: Components, store, config
- Used by: Next.js framework

## Data Flow

**PDF Upload → Parsed Manifest → Seat Map Display:**

1. User uploads PDF via Dropzone component or file input (src/app/page.tsx)
2. File sent to `/api/parse` endpoint as FormData (src/app/api/parse/route.ts)
3. Server extracts text from PDF buffer using pdf-parse
4. Regex parsing identifies:
   - Flight header (flight number, date, origin, aircraft type)
   - Passenger records (seat, name, cabin, destination, status, meal, SSR codes)
5. Server enriches passenger data across 5 parsing passes:
   - Pass 1: Main passenger block extraction
   - Pass 2: Status/LifeMiles enrichment (status codes like DIAM, GOLD)
   - Pass 3: Special meal codes (GFML, MEML, etc.)
   - Pass 4: Passenger type codes (CHD, INF, STAFF)
   - Pass 5: Special Service Requests (WCHR, PETC, etc.)
6. Parsed data returned as JSON: `{ passengers, flightInfo }`
7. Client updates Zustand store via `setManifestData()`
8. SeatMap component reads store and renders visualization:
   - Fetches selectedFleet config
   - Maps passengers to seat grid
   - Renders cabins with rows
9. User interacts: click seat → selectedSeat state updates → detail panel appears
10. Export: `html-to-image` converts DOM to PNG, downloads as image

**State Management Flow:**

```
useStore (Zustand)
  ├── passengers: Record<seat, Passenger>
  ├── flightInfo: FlightInfo
  ├── selectedFleet: AircraftConfig
  └── Actions: setManifestData, setFleet, reset
```

State updated in page.tsx → re-render SeatMap → SeatMap reads store → renders updated grid

**User Interactions:**

- **Load PDF:** page.tsx → handleUpload → fetch /api/parse → setManifestData → store updates
- **Select Fleet:** page.tsx header select → setFleet → store updates selectedFleet
- **Click Seat:** SeatMap → onSeatClick → setSelectedSeat (local state) → detail panel appears
- **Export Map:** SeatMap → handleExport → html-to-image toPng → download

## Key Abstractions

**Passenger Record:**
- Purpose: Represents a single airline passenger with all manifest data
- Examples: `src/store/useStore.ts` (Passenger interface), `src/app/api/parse/route.ts` (passenger object building)
- Pattern: Flat object with optional fields (status, ssr, meal, type), keyed by seat ID

**AircraftConfig:**
- Purpose: Defines seat layout and cabin structure for an aircraft type
- Examples: `src/config/fleet.ts` (FLEET_DICTIONARY['788'], ['320'], ['32N'])
- Pattern: Recursive cabin definitions with startRow, endRow, layout (2D array of seat letters)

**FlightInfo:**
- Purpose: Metadata about a flight extracted from manifest
- Examples: `src/store/useStore.ts` (FlightInfo interface), `src/app/api/parse/route.ts` (extraction logic)
- Pattern: Immutable, set once during PDF parse, used in UI headers and exports

**Seat Component:**
- Purpose: Individual seat button with passenger-driven styling
- Examples: `src/components/SeatMap.tsx` (Seat function)
- Pattern: Controlled component receiving id, passenger, isSelected, onClick, cabinType props

**CabinRow Component:**
- Purpose: Render one row of seats with proper spacing and alignment
- Examples: `src/components/SeatMap.tsx` (CabinRow function)
- Pattern: Maps layout array (groups of seat letters) to Seat instances

## Entry Points

**Web Application Entry:**
- Location: `src/app/page.tsx`
- Triggers: User navigates to `/` or loads application
- Responsibilities: Render header with flight info and fleet selector, show Dropzone or SeatMap based on flightInfo state, handle file upload flow

**API Entry Point:**
- Location: `src/app/api/parse/route.ts`
- Triggers: POST request to `/api/parse` with file in FormData
- Responsibilities: Parse PDF, extract passengers and flight data, return JSON response

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Wraps all pages
- Responsibilities: Set metadata, load Inter font, provide HTML structure, suppress hydration warnings

## Error Handling

**Strategy:** Try-catch with user-facing error messages

**Patterns:**

- **API Layer:** Route handler catches errors, logs to console, returns NextResponse.json with error field and 500 status
- **Client Layer:** fetch error handling in page.tsx checks res.ok, parses response.error, displays in red error box to user
- **Validation:** Minimal — regex patterns validate seat format (3 digits + letter), cabin codes (C/Y), known SSR/meal/type codes via Set checks

## Cross-Cutting Concerns

**Logging:** 
- Console.error in API route for PDF parse failures (src/app/api/parse/route.ts line 317)
- No structured logging framework

**Validation:**
- Regex-based: SEAT_RE pattern for seat extraction, section header detection via startsWith checks
- Set-based: SSR_CODES, MEAL_CODES, TYPE_CODES, CABIN_CODES for known value validation
- No schema validation library (no Zod, Joi, etc.)

**Authentication:**
- None — application is stateless, public-facing utility
- No user accounts, no session management

**Styling:**
- Tailwind CSS v4 (config via @tailwindcss/postcss in package.json)
- Applied inline as className strings in all components
- Dark mode support via dark: prefix (used in Dropzone, SeatMap)

---

*Architecture analysis: 2026-05-07*
