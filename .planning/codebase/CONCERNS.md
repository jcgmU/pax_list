# Codebase Concerns

**Analysis Date:** 2026-05-07

## Tech Debt

**Complex PDF Parsing Logic:**
- Issue: The PDF parsing logic in `src/app/api/parse/route.ts` is monolithic and highly coupled to specific PDF format assumptions. Contains hardcoded regex patterns and multiple sequential passes over data.
- Files: `src/app/api/parse/route.ts` (320 lines)
- Impact: Brittle parser that fails silently on format variations, difficult to maintain, hard to extend with new field types
- Fix approach: Extract parsing logic into dedicated modules (e.g., `src/lib/parsers/pdfManifestParser.ts`), create abstraction layer for field extraction, use composition for parsing stages

**Type Safety Gaps in API Response:**
- Issue: API response typing relies on `any` type casting. No formal schema validation for parsed PDF data before returning to client.
- Files: `src/app/api/parse/route.ts` (line 41), `src/app/page.tsx` (line 41)
- Impact: Invalid data can reach UI components, runtime errors not caught at boundaries
- Fix approach: Implement Zod schemas for `Passenger` and `FlightInfo` validation, validate before response (package `zod` is already in devDependencies but unused)

**Untyped Component Props:**
- Issue: Component props use `any` type instead of proper interfaces.
- Files: `src/components/SeatMap.tsx` (lines 18, 49)
- Impact: No compile-time checking of prop contracts, IDE autocompletion disabled
- Fix approach: Create `SeatProps` and `CabinRowProps` interfaces in `src/components/types.ts`

## Known Bugs

**Undefined Variable Reference:**
- Symptoms: Parser crashes when processing passengers with "CLIENTE TOP" status
- Files: `src/app/api/parse/route.ts` (lines 211, 220)
- Trigger: Any manifest where a passenger has `clienteTop` variable referenced
- Workaround: Variable `clienteTop` is referenced but never defined; should check `isClienteTop` instead
- Fix: Line 211 should use `isClienteTop` instead of undefined `clienteTop`

**Lost Passenger Data on Page Breaks:**
- Symptoms: Some passengers from multi-page manifests have incomplete information
- Files: `src/app/api/parse/route.ts` (lines 207-224)
- Trigger: Passenger appearing on both page 1 and page 2 of manifest
- Current behavior: Duplicate detection merges fields, but only if seat exists in first pass
- Fix approach: Implement more robust duplicate detection using firstName + lastName fallback

## Security Considerations

**No Input Validation on PDF Files:**
- Risk: Accepting arbitrary PDF files without size limits or type validation. Potential for ReDoS attacks with pathological regex patterns.
- Files: `src/app/api/parse/route.ts` (line 20), `src/components/Dropzone.tsx` (line 49)
- Current mitigation: Browser-level accept filter (application/pdf) only
- Recommendations: 
  - Add server-side file size limit (e.g., 10MB)
  - Validate PDF structure before parsing
  - Add timeout to pdf-parse operation
  - Consider rate limiting on `/api/parse` endpoint

**XSS Vulnerability in Passenger Names:**
- Risk: Passenger first/last names are rendered directly in UI without sanitization
- Files: `src/components/SeatMap.tsx` (lines 185-186)
- Current mitigation: React escaping by default (but verify in complex renders)
- Recommendations: Use `<> {name} </>` or sanitize if names could contain HTML

## Performance Bottlenecks

**Unoptimized PDF Parsing:**
- Problem: Text extraction with `pdf-parse` extracts entire document text and processes sequentially. Multiple regex scans over full dataset.
- Files: `src/app/api/parse/route.ts` (lines 28-139)
- Cause: Line 121-139 creates intermediate `chunks[]` array, then 8 additional sequential passes over data
- Improvement path: 
  - Use event-driven parser instead of multi-pass
  - Extract only relevant PDF regions
  - Cache regex patterns with precompiled patterns

**Client-Side Rendering of Large Seat Maps:**
- Problem: Rendering 400+ seat components causes unnecessary re-renders
- Files: `src/components/SeatMap.tsx` (lines 239-252)
- Cause: Row array generation inside map without memoization
- Improvement path: Memoize `CabinRow`, use `useCallback` for `onSeatClick`, virtualize large cabin lists

**Memory Leak on Component Export:**
- Problem: `toPng()` with `pixelRatio: 2` can consume significant memory for large maps
- Files: `src/components/SeatMap.tsx` (lines 82-94)
- Cause: No cleanup of canvas/image data after export
- Improvement path: Add `AbortController` timeout, implement progressive rendering for large maps

## Fragile Areas

**PDF Format Assumptions:**
- Files: `src/app/api/parse/route.ts`
- Why fragile: 
  - Assumes exact spacing in "Flight Information" section (lines 44-59)
  - Expects cabin codes as single letters (line 154)
  - Hardcoded section header detection (lines 85-117) - maintenance nightmare
- Safe modification: Extract format specification to config, add format version detection, implement fallback patterns
- Test coverage: No unit tests for parser

**Seat Layout Configuration:**
- Files: `src/config/fleet.ts`
- Why fragile: Hardcoded aircraft configs, no validation that seat counts match layouts
- Safe modification: Add schema validation for aircraft configs, warn if layout doesn't match cabin row range
- Test coverage: No validation of fleet configurations

**State Management:**
- Files: `src/store/useStore.ts`
- Why fragile: Simple Zustand store with no persistence, no error recovery. Selecting fleet doesn't validate against available seats.
- Safe modification: Add middleware for state persistence, validate fleet selection against loaded passenger data
- Test coverage: None

## Scaling Limits

**Single API Endpoint for All Parsing:**
- Current capacity: Tested up to ~500 passengers (estimated)
- Limit: Manifests >1000 passengers will timeout or OOM
- Scaling path: 
  - Implement streaming response with Server-Sent Events
  - Add background job queue (Bull/BullMQ)
  - Cache parsed manifests by flight number + date

**In-Memory Passenger Storage:**
- Current capacity: ~50 manifests before memory issues
- Limit: No persistence; closing app loses all data
- Scaling path: 
  - Add localStorage for client-side caching
  - Implement IndexedDB for larger datasets
  - Add session-based storage on backend

## Dependencies at Risk

**pdf-parse Version Freeze:**
- Risk: `pdf-parse@2.4.5` (fixed version, not semver range). May have security vulnerabilities.
- Impact: No automatic security patches
- Migration plan: Upgrade to `^2.4.5` with thorough testing, or evaluate `pdfjs-dist` directly

**html-to-image as Export Mechanism:**
- Risk: Library is not well-maintained, uses canvas rendering which is browser-dependent
- Impact: Export functionality may break in newer browsers
- Migration plan: Consider Server-Side rendering solution (e.g., Playwright/Puppeteer for PDF export)

## Missing Critical Features

**No Error Recovery:**
- Problem: Parser fails silently on malformed sections. Users see generic error message without debugging info.
- Blocks: Cannot handle manifests from different airline PDF formats
- Recommendation: Implement error logging, structured error messages, fallback parsing modes

**No Manifest History:**
- Problem: No ability to compare manifests or track changes
- Blocks: Operational workflows that require historical data
- Recommendation: Add database layer with manifest versioning

**No User Customization:**
- Problem: Fleet configurations are hardcoded. Cannot add new aircraft types or modify seat layouts
- Blocks: Support for different airlines or aircraft variants
- Recommendation: Create admin interface for fleet management

## Test Coverage Gaps

**No Unit Tests for PDF Parser:**
- What's not tested: All parsing logic in `src/app/api/parse/route.ts`
- Files: `src/app/api/parse/route.ts`
- Risk: Parser changes break silently; regression bugs compound
- Priority: **High** - Parser is core logic

**No Integration Tests:**
- What's not tested: Full flow from PDF upload to rendered seat map
- Files: All files
- Risk: Subtle bugs in data flow go undetected
- Priority: **High**

**No Component Tests:**
- What's not tested: SeatMap component selection, export functionality, responsive layout
- Files: `src/components/SeatMap.tsx`, `src/components/Dropzone.tsx`
- Risk: UI behavior regressions
- Priority: **Medium** - UI-only impact

**No E2E Tests:**
- What's not tested: Real manifest files, browser compatibility
- Files: All files
- Risk: Production failures
- Priority: **Medium** - Can use manual testing with sample PDFs

---

*Concerns audit: 2026-05-07*
