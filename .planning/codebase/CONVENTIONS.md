# Coding Conventions

**Analysis Date:** 2026-05-07

## Naming Patterns

**Files:**
- React components: PascalCase with .tsx extension (e.g., `Dropzone.tsx`, `SeatMap.tsx`)
- Configuration files: camelCase with meaningful suffixes (e.g., `fleet.ts`, `useStore.ts`)
- API routes: descriptive names in lowercase under `app/api/` directory structure (e.g., `route.ts`)
- Test files: JavaScript files at project root with `test-` prefix (e.g., `test-parser.js`, `test-pdf.js`)

**Functions:**
- camelCase for all function names
- Event handlers: `handle` prefix (e.g., `handleUpload`, `handleDragOver`, `handleDrop`, `handleChange`)
- Hook names: `use` prefix for custom hooks (e.g., `useStore`)
- Arrow functions preferred for callbacks and handlers

**Variables:**
- camelCase for all variable declarations
- React state: descriptive names with potential prefixes for flags (e.g., `isLoading`, `isDragActive`, `selectedSeat`, `error`)
- Constants that are global: SCREAMING_SNAKE_CASE for Sets and collections (e.g., `SSR_CODES`, `MEAL_CODES`, `TYPE_CODES`, `STATUS_CODES`, `CABIN_CODES`)

**Types:**
- PascalCase for interfaces and types (e.g., `Passenger`, `FlightInfo`, `AppState`, `AircraftConfig`, `CabinConfig`, `DropzoneProps`, `CabinType`)
- Use `interface` for object shapes, `type` for unions or aliases
- Prefix prop interfaces with component name or generic `Props` suffix (e.g., `DropzoneProps`)

## Code Style

**Formatting:**
- TypeScript is the primary language for source code
- ECMAScript 2017 target (ES2017) via tsconfig.json
- Module resolution: bundler (Next.js/ESM)
- JSX as react-jsx (automatic runtime)

**Linting:**
- ESLint 9.x with Next.js configuration
- Config file: `eslint.config.mjs` using flat config format
- Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run with: `npm run lint` (eslint command without arguments)

**Styling:**
- Tailwind CSS 4.x via @tailwindcss/postcss
- All styling is inline as className attributes (no separate CSS files except globals)
- Responsive classes use Tailwind breakpoints (e.g., `sm:`, `md:`, `lg:`)
- Color palette: slate, gray, blue, indigo, red, green, orange, yellow, pink, amber
- Interactive states: hover, focus, transition-colors, transition-all
- Layout: flexbox and grid with Tailwind utilities

## Import Organization

**Order:**
1. React and core libraries (`import React, { ... } from 'react'`)
2. Next.js utilities and types (`import { NextResponse } from 'next/server'`)
3. Third-party packages (e.g., `zustand`, `lucide-react`, `pdf-parse`, `html-to-image`)
4. Type imports from project (`import type { ... }`)
5. Local imports with @ alias (`import { ... } from '@/...`')
6. Relative imports (used rarely, prefer @ alias)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in tsconfig.json)
- Always use `@/` prefix for absolute imports within src directory
- Examples:
  - `@/components/Dropzone`
  - `@/store/useStore`
  - `@/config/fleet`

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (e.g., PDF parsing, API calls)
- Catch any errors with type `any` when broad error handling needed: `catch (err: any)`
- Extract error messages: `err.message || 'Fallback error message'`
- Set error state explicitly: `setError(err.message || 'An error occurred during parsing')`
- Always clean up state in finally blocks
- API routes return `NextResponse.json()` with appropriate status codes
- Validation errors return 400 status, processing errors return 500 status

**Example from `src/app/page.tsx`:**
```typescript
try {
  // operation
} catch (err: any) {
  setError(err.message || 'An error occurred during parsing');
} finally {
  setIsLoading(false);
}
```

## Logging

**Framework:** `console` object only (no logger library)

**Patterns:**
- `console.error()` for error tracking in catch blocks (e.g., PDF parsing failures)
- Used sparingly in API routes for debugging
- Example from `src/app/api/parse/route.ts`:
  ```typescript
  catch (error: any) {
    console.error('PDF Parse error:', error);
    return NextResponse.json({ error: error.message || 'Error processing PDF' }, { status: 500 });
  }
  ```

## Comments

**When to Comment:**
- Comments are rare in this codebase; code structure is clear from naming
- Section dividers used in complex parsing logic to separate logical passes
- Example from `src/app/api/parse/route.ts`:
  ```
  // ── 1. Clean raw lines ──────────────────────────────────────────────────
  // ── 2. Extract Flight Header ─────────────────────────────────────────────
  ```

**JSDoc/TSDoc:**
- No JSDoc comments observed in source code
- Type information provided via TypeScript interfaces instead

## Function Design

**Size:**
- Most functions are small and focused (10-50 lines typical)
- Complex parsing logic in `src/app/api/parse/route.ts` broken into numbered passes

**Parameters:**
- React components receive typed props objects (e.g., `DropzoneProps`)
- Event handlers accept React event objects typed explicitly (e.g., `React.DragEvent`, `React.ChangeEvent<HTMLInputElement>`)
- Callback functions explicitly typed with function signatures

**Return Values:**
- Components return JSX.Element (implicit from returning JSX)
- API routes return `NextResponse<T>` object
- Async handlers wrapped in try-catch, state updated via setters
- Regular utility functions return their computed values directly

## Module Design

**Exports:**
- Named exports for components: `export function ComponentName() {}`
- Named exports for stores and config: `export const useStore`, `export const FLEET_DICTIONARY`
- Type exports: `export interface TypeName {}`
- Default exports rare (used in root `layout.tsx` and `page.tsx`)

**Barrel Files:**
- Not used; imports are specific to file locations

**Client vs Server:**
- Client components marked with `'use client'` directive at top (e.g., `src/app/page.tsx`, `src/components/Dropzone.tsx`, `src/components/SeatMap.tsx`)
- API routes are server-only (`src/app/api/parse/route.ts`)
- State management (Zustand) on client side only

## Zustand Store Pattern

**Location:** `src/store/useStore.ts`

**Pattern:**
```typescript
export const useStore = create<AppState>((set) => ({
  // state
  passengers: {},
  flightInfo: null,
  selectedFleet: FLEET_DICTIONARY['788'],
  // updaters
  setFleet: (fleetId) => set({ selectedFleet: ... }),
  setManifestData: (data) => set({ ... }),
  reset: () => set({ ... }),
}));
```

- Single store file for app-wide state
- Interface defines entire state shape with update methods
- Immutable updates via `set()`
- Called with hook syntax: `const { passengers, setFleet } = useStore()`

---

*Convention analysis: 2026-05-07*
