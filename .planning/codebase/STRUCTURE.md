# Codebase Structure

**Analysis Date:** 2026-05-07

## Directory Layout

```
pax-map/
├── .planning/
│   └── codebase/                # GSD planning documents
├── docs/                        # Documentation files (not in src)
├── public/                      # Static assets (favicon, images)
├── src/                         # Application source code
│   ├── app/                     # Next.js App Router
│   │   ├── api/
│   │   │   └── parse/
│   │   │       └── route.ts     # PDF parsing API endpoint
│   │   ├── favicon.ico
│   │   ├── globals.css          # Global Tailwind styles
│   │   ├── layout.tsx           # Root layout wrapper
│   │   └── page.tsx             # Home page (main UI)
│   ├── components/              # Reusable React components
│   │   ├── Dropzone.tsx         # File upload area
│   │   └── SeatMap.tsx          # Cabin visualization
│   ├── config/                  # Application configuration
│   │   └── fleet.ts             # Aircraft fleet definitions
│   └── store/                   # State management
│       └── useStore.ts          # Zustand global state
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.*           # (if present) Tailwind config
├── postcss.config.mjs          # PostCSS for Tailwind
├── eslint.config.mjs           # ESLint rules
└── .gitignore                  # Git ignore rules
```

## Directory Purposes

**`.planning/codebase/`:**
- Purpose: GSD (Goal Spec Driven) planning documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Contains: Markdown analysis files for code navigation and planning
- Key files: ARCHITECTURE.md, STRUCTURE.md

**`src/`:**
- Purpose: All application source code
- Contains: React components, API routes, configuration, state management
- Key files: page.tsx (entry), SeatMap.tsx (main visualization), fleet.ts (data)

**`src/app/`:**
- Purpose: Next.js App Router pages and API routes
- Contains: page.tsx (home), layout.tsx (root), api/parse/route.ts (backend)
- Key files: None, but parent of all routing

**`src/app/api/parse/`:**
- Purpose: Server-side PDF parsing API
- Contains: Single route handler for POST /api/parse
- Key files: `route.ts` — handles FormData PDF upload, parses text, extracts passengers

**`src/components/`:**
- Purpose: Reusable React UI components
- Contains: Presentational and semi-smart components (use Zustand hooks)
- Key files: 
  - `Dropzone.tsx` — file upload area with drag-drop
  - `SeatMap.tsx` — cabin visualization, seat grid, passenger detail panel

**`src/config/`:**
- Purpose: Application configuration and data dictionaries
- Contains: Aircraft fleet configurations, seat layouts
- Key files: `fleet.ts` — FLEET_DICTIONARY (Boeing 787-8, A320, A320neo definitions)

**`src/store/`:**
- Purpose: Centralized state management
- Contains: Zustand store definition, TypeScript interfaces for app state
- Key files: `useStore.ts` — global state: passengers, flightInfo, selectedFleet

**`public/`:**
- Purpose: Static assets served by Next.js
- Contains: favicon, potentially images
- Key files: favicon.ico (referenced in layout)

**`docs/`:**
- Purpose: Project documentation (outside src)
- Contains: User guides, API docs, etc.
- Key files: Unknown (not explored)

## Key File Locations

**Entry Points:**

- `src/app/page.tsx` — Main UI page, handles PDF upload flow, conditionally renders Dropzone or SeatMap
- `src/app/layout.tsx` — Root HTML structure, metadata, font loading
- `src/app/api/parse/route.ts` — Backend POST endpoint for PDF parsing

**Configuration:**

- `src/config/fleet.ts` — Aircraft fleet definitions (layout, cabins, rows)
- `next.config.ts` — Next.js config (serverExternalPackages for pdf-parse)
- `tsconfig.json` — TypeScript compiler options (path alias @/*: src/*)
- `package.json` — Dependencies (Next.js 16, React 19, Zustand, html-to-image, pdf-parse, Tailwind)

**Core Logic:**

- `src/app/api/parse/route.ts` — 5-pass PDF parsing algorithm (lines 17-320)
  - Pass 1: Extract seat, name, cabin, destination from main passenger block
  - Pass 2: Enrich status from LifeMiles section
  - Pass 3: Add meal codes from Special Meal section
  - Pass 4: Add passenger types (CHD, INF, STAFF)
  - Pass 5: Add SSRs (wheelchair, pet, etc.)
- `src/store/useStore.ts` — Zustand state: passengers dict, flightInfo, selectedFleet
- `src/components/SeatMap.tsx` — Renders seat grid based on selectedFleet cabin configs, handles seat selection

**Styling:**

- `src/app/globals.css` — Global CSS (Tailwind directives)
- `src/components/*.tsx` — Inline Tailwind classes (no CSS modules)
- `tailwind.config.*` — (Not found, using defaults)

**Testing:**

- `test-parser.js` — Manual test script (not in test framework)
- `test-pdf.js` — Manual test script (not in test framework)
- No Jest/Vitest config found

## Naming Conventions

**Files:**

- React components: PascalCase (Dropzone.tsx, SeatMap.tsx)
- API routes: snake_case directories with route.ts (api/parse/route.ts)
- Config modules: kebab-case or camelCase (fleet.ts, useStore.ts)
- Styles: globals.css (global), component-scoped via inline Tailwind
- Test files: test-*.js (manual tests, not framework-based)

**Directories:**

- Feature directories: lowercase (app, api, components, config, store)
- Nested routes follow Next.js convention: /api/parse/route.ts → POST /api/parse

**Functions:**

- React components: PascalCase (Home, Dropzone, SeatMap)
- Helper functions: camelCase (handleUpload, handleExport, getStatusStyles)
- Hooks: camelCase with use prefix (useStore, useCallback, useState)

**Variables:**

- Constants: UPPERCASE (FLEET_DICTIONARY, SSR_CODES, SEAT_RE)
- State variables: camelCase (passengers, flightInfo, selectedFleet)
- Local state: camelCase (isLoading, error, isDragActive, selectedSeat)

**Types:**

- Interfaces: PascalCase (Passenger, FlightInfo, AppState, AircraftConfig, CabinConfig)
- Type aliases: PascalCase (CabinType = 'C' | 'Y')
- Generic types: Generic<T> standard

**Classes:**

- None used in codebase

## Where to Add New Code

**New Feature (e.g., passenger search, filtering):**
- Primary code: `src/components/` for UI, `src/store/useStore.ts` for state
- Tests: Create new test-*.js file or configure Jest/Vitest
- Example: Create `src/components/PassengerSearch.tsx`, extend store with filter state

**New Component/Module:**
- Implementation: `src/components/YourComponent.tsx` for presentational
- Logic: `src/store/useStore.ts` or `src/config/` if pure data
- Styling: Use inline Tailwind className (follow existing pattern)
- Integration: Import in `src/app/page.tsx` or parent component

**Utilities/Helpers:**
- Shared helpers: Create `src/utils/` directory (currently absent)
- Example: If adding PDF parsing helpers → `src/utils/pdfHelpers.ts`
- Import in `src/app/api/parse/route.ts` as needed

**New Fleet Aircraft:**
- Location: `src/config/fleet.ts`
- Add new entry to FLEET_DICTIONARY with AircraftConfig shape
- Define cabins array with cabin name, type, row range, and seat layout
- Update Home page fleet selector to pick up automatically

**New API Endpoint:**
- Location: `src/app/api/[feature]/route.ts`
- Example: Create `src/app/api/validate/route.ts` for pre-upload validation
- Export async function matching HTTP verb (POST, GET, etc.)
- Return NextResponse.json() for responses

**Styling Updates:**
- Tailwind: Add classes inline (no CSS modules in use)
- If shared theme needed: Update `src/app/globals.css` or consider Tailwind config
- Example: New component? Use existing color/spacing tokens (slate-*, blue-*, etc.)

## Special Directories

**`.planning/`:**
- Purpose: GSD orchestration files and codebase analysis documents
- Generated: Yes (by GSD commands)
- Committed: Yes (to git)

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next build` or `next dev`)
- Committed: No (.gitignore excludes)

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (by npm install)
- Committed: No (.gitignore excludes)

**`public/`:**
- Purpose: Static assets (favicon, images, etc.)
- Generated: No (user-created)
- Committed: Yes (typically)

**`docs/`:**
- Purpose: Project documentation (README, guides, etc.)
- Generated: No (user-created)
- Committed: Yes

## Path Aliases

**TypeScript Path Alias:**
- `@/*` → `src/*` (configured in tsconfig.json)
- Usage: `import { SeatMap } from '@/components/SeatMap'` instead of `'../../components/SeatMap'`
- Applied throughout: All component imports use @/ prefix

## Import Organization Pattern

Observed pattern in codebase:

```typescript
// 1. React/Next.js core
import React, { useState, useRef } from 'react';
import { NextResponse } from 'next/server';

// 2. Third-party libraries
import { toPng } from 'html-to-image';
import { useStore } from '@/store/useStore';  // Note: local imports use @/
import { Plane, FileText } from 'lucide-react';

// 3. Local imports
import { Dropzone } from '@/components/Dropzone';
import { FLEET_DICTIONARY } from '@/config/fleet';

// 4. No barrel exports (index.ts) in use currently
```

---

*Structure analysis: 2026-05-07*
