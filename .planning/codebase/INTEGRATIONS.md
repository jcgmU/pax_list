# External Integrations

**Analysis Date:** 2026-05-07

## APIs & External Services

**PDF Processing API (Internal):**
- Endpoint: `/api/parse` (POST)
- What it's used for: Parse flight manifests from PDF files
- SDK/Client: Built-in Next.js API routes
- Authentication: None (internal endpoint)

## Data Storage

**Databases:**
- Not applicable - No persistent database configured
- State management: Client-side only (Zustand store in memory)
- Data persistence: Browser session only (no localStorage or IndexedDB integration)

**File Storage:**
- Local filesystem only - PDF uploads are processed in-memory
- No external storage service (S3, Azure Blob, etc.)

**Caching:**
- None - Application is stateless on server side

## Authentication & Identity

**Auth Provider:**
- None - Application has no authentication/authorization layer
- All endpoints are public
- No user login or access control implemented

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar integration
- Console logging only in API route: `console.error('PDF Parse error:', error)` at `src/app/api/parse/route.ts:317`

**Logs:**
- Console output only (development and server logs)

## CI/CD & Deployment

**Hosting:**
- Not configured - Framework-agnostic (supports Vercel, Railway, Render, self-hosted, etc.)

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or similar configuration

## Environment Configuration

**Required env vars:**
- None detected - Application requires no external API keys or secrets

**Secrets location:**
- Not applicable - No secrets management configured

## Webhooks & Callbacks

**Incoming:**
- None - Application does not receive webhooks

**Outgoing:**
- None - Application does not send webhooks to external services

## Data Flow

**PDF Upload Flow:**
1. User selects PDF via `Dropzone` component (`src/components/Dropzone.tsx`)
2. File sent to `/api/parse` endpoint via `fetch` POST request (`src/app/page.tsx`)
3. Server parses PDF using `pdf-parse` library (`src/app/api/parse/route.ts`)
4. Extracted passenger data (passengers, flightInfo) returned as JSON
5. Data stored in Zustand store (`src/store/useStore.ts`)
6. Frontend renders seat map using stored data (`src/components/SeatMap.tsx`)

**Export Flow:**
- Seat map rendered as DOM → converted to PNG via `html-to-image` → downloaded to user's computer
- No external service calls involved

## Current State Summary

This is a **frontend-heavy, offline-first application** with minimal external integrations:

- ✅ Works entirely client-side after PDF upload
- ✅ No database or persistent storage
- ✅ No authentication or multi-user support
- ✅ No external APIs (except pdf-parse for PDF parsing)
- ✅ No real-time features or websockets
- ✅ No monitoring or analytics
- ✅ No secrets or environment configuration needed

## Potential Future Integrations

If the application evolves, consider adding:

1. **Persistent Storage**: Database (PostgreSQL, SQLite, etc.) to save flight manifests
2. **Authentication**: User login system for multi-user support
3. **File Storage**: S3 or similar for archiving uploaded PDFs
4. **Export**: PDF generation library for exporting seat maps as PDF
5. **Monitoring**: Error tracking (Sentry) and analytics
6. **Real-time**: WebSocket support for collaborative seat map editing

---

*Integration audit: 2026-05-07*
