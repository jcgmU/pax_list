# Technology Stack

**Analysis Date:** 2026-05-07

## Languages

**Primary:**
- TypeScript 5 - Full application (frontend and backend)
- JSX/TSX - React components and server components

**Secondary:**
- JavaScript - Build and configuration files (.mjs, .ts config)
- CSS - Styling (via Tailwind CSS)

## Runtime

**Environment:**
- Node.js (via Next.js 16.2.4)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (presence assumed, not verified)

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack framework (frontend + API routes)
  - App Router (modern directory-based routing)
  - Server Components (default in App Router)
  - API Routes: `src/app/api/parse/route.ts`

**Frontend:**
- React 19.2.4 - UI component library
  - React DOM 19.2.4 - DOM rendering
  - Client Components using `'use client'` directive

**UI Components:**
- Lucide React 1.11.0 - Icon library
  - Used for: UploadCloud, FileType, Users, Info, Dog, Accessibility, Crown, Coffee, User, Download icons

**State Management:**
- Zustand 5.0.12 - Lightweight state management
  - Store location: `src/store/useStore.ts`
  - Manages: passengers, flightInfo, selectedFleet state

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - PostCSS plugin for Tailwind
- PostCSS - CSS transformation pipeline

**Testing:**
- ESLint 9 - Code linting
  - Config: `eslint.config.mjs`
  - Extends: `eslint-config-next` with TypeScript support

**Build/Dev:**
- TypeScript 5 - Type checking and compilation
- Next.js build system - Turbopack powered build

## Key Dependencies

**Critical:**
- next 16.2.4 - Core framework managing routing, SSR, API routes
- react 19.2.4 - UI library (required by Next.js)
- react-dom 19.2.4 - DOM rendering (required by React)

**PDF Processing:**
- pdf-parse 2.4.5 - Parse PDF content to text
  - Used in: `src/app/api/parse/route.ts` for flight manifest parsing
  - Marked as external package in next.config.ts (serverExternalPackages)

**File Export:**
- html-to-image 1.11.13 - Convert DOM to PNG/JPG
  - Used in: `src/components/SeatMap.tsx` for downloading seat maps
  - Function: `toPng()`

**UI State:**
- lucide-react 1.11.0 - Icon components
- zustand 5.0.12 - Client-side state management

**Dev Dependencies:**
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- eslint-config-next 16.2.4 - ESLint configuration for Next.js
- tailwindcss 4 - CSS framework bundler

## Configuration

**Environment:**
- Development: `npm run dev` (Next.js dev server on port 3000)
- Production: `npm run build && npm run start`
- Linting: `npm run lint` (ESLint)

**TypeScript:**
- Target: ES2017
- Module system: esnext with bundler resolution
- JSX: react-jsx (automatic imports)
- Path aliases: `@/*` maps to `./src/*`
- Strict mode enabled

**Next.js Configuration:**
- File: `next.config.ts`
- External packages for server: `["pdf-parse", "pdfjs-dist"]`
- Purpose: Ensures PDF libraries run on server, not bundled for client

**Build Configuration:**
- Tailwind CSS 4 (modern version with no separate @tailwind directives)
- PostCSS configured in `postcss.config.mjs`
- ESLint 9 with modern config system (eslint.config.mjs)

## Platform Requirements

**Development:**
- Node.js runtime
- Package manager (npm)
- TypeScript compiler
- Modern browser for development preview

**Production:**
- Node.js server (for API routes and SSR)
- Browser support: Modern browsers (ES2017+)
- Deployment target: Any Node.js 18+ hosting (Vercel, Railway, Render, self-hosted, etc.)

---

*Stack analysis: 2026-05-07*
