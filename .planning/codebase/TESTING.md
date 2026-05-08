# Testing Patterns

**Analysis Date:** 2026-05-07

## Test Framework

**Runner:**
- No formal test framework configured (Jest, Vitest not installed)
- Testing done with manual Node.js scripts using CommonJS

**Assertion Library:**
- No assertion library; uses manual console output and inspection for validation

**Run Commands:**
```bash
node test-parser.js        # Run PDF parser tests against sample manifests
node test-pdf.js           # Simple PDF text extraction verification
```

## Test File Organization

**Location:**
- Test files stored at project root (not co-located with source)
- Separate from main `src/` directory

**Naming:**
- `test-` prefix followed by subject name (e.g., `test-parser.js`, `test-pdf.js`)

**Structure:**
```
pax-map/
├── test-parser.js         # Parser validation tests
├── test-pdf.js            # PDF extraction tests
└── docs/                  # Sample PDF manifests for testing
    ├── PAXLIST_AV9726_CLO_2026-04-24.pdf
    └── PAXLIST_AV26_BOG_2026-04-25.pdf
```

## Test Structure

**Test Patterns:**

### PDF Parser Test (`test-parser.js`)

Validates the core PDF parsing logic through black-box testing:

```javascript
async function main() {
  const files = ['docs/PAXLIST_AV9726_CLO_2026-04-24.pdf', 'docs/PAXLIST_AV26_BOG_2026-04-25.pdf'];
  for (const f of files) {
    console.log(`\n===== ${f} =====`);
    const result = await parsePDF(f);
    const paxArr = Object.values(result.passengers);
    
    // Validate flightInfo extraction
    console.log('FlightInfo:', JSON.stringify(result.flightInfo));
    console.log('Total passengers:', paxArr.length);
    
    // Inspect passenger samples
    console.log('\nFirst 5:');
    paxArr.slice(0,5).forEach(p => console.log(JSON.stringify(p)));
    
    // Filter and validate by category
    const withStatus = paxArr.filter(p => p.status);
    console.log(`\nWith status (${withStatus.length} total), first 5:`);
    withStatus.slice(0,5).forEach(p => console.log(JSON.stringify(p)));
    
    const withSSR = paxArr.filter(p => p.ssr.length > 0);
    console.log(`\nWith SSR (${withSSR.length} total):`);
    withSSR.forEach(p => console.log(JSON.stringify(p)));
    
    const withMeal = paxArr.filter(p => p.meal);
    console.log(`\nWith meal (${withMeal.length} total):`);
    withMeal.forEach(p => console.log(JSON.stringify(p)));
  }
}
main().catch(console.error);
```

**Key Patterns:**
- Tests multiple real PDF files
- Validates core data extraction (flightInfo fields)
- Filters by passenger attributes (status, SSR, meals)
- Outputs JSON for manual inspection
- Captures totals and samples for verification

### PDF Text Extraction Test (`test-pdf.js`)

Simple integration test for pdf-parse library:

```javascript
async function run() {
  try {
    const dataBuffer = fs.readFileSync('docs/PAXLIST_AV26_BOG_2026-04-25.pdf');
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    console.log("Success, text length:", data.text.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
```

**Pattern:**
- Smoke test for PDF library functionality
- Validates file reading and parser initialization
- Outputs text length as sanity check

## Mocking

**Framework:** None (no mocking library used)

**What's Mocked:**
- No mocking in current test setup
- Tests use real PDF files from `docs/` directory
- Real file I/O with `fs.readFileSync()`

**Integration with API:**
- Server-side parser tests (`test-parser.js`) duplicate the parsing logic from `src/app/api/parse/route.ts`
- Allows testing without spinning up Next.js server
- Same validation logic runs in both contexts

## Fixtures and Test Data

**Test Data:**
- Real PDF files stored in `docs/` directory:
  - `PAXLIST_AV9726_CLO_2026-04-24.pdf`
  - `PAXLIST_AV26_BOG_2026-04-25.pdf`

**Usage:**
- Referenced directly by file path in test scripts
- Multiple manifests test parser robustness across different structures

**Location:**
- Test data files in project root under `docs/` subdirectory

## Coverage

**Requirements:** None enforced

**Current State:**
- No coverage reporting
- Manual inspection-based validation via console output
- PDF parsing logic has dual coverage: tested via Node.js script and in production via API route

## Test Types

**Unit Tests:**
- None formally defined
- Parser logic (`test-parser.js`) functions as integration test of PDF parsing algorithm

**Integration Tests:**
- `test-parser.js`: Full pipeline from PDF bytes → passenger records
  - Validates flight info extraction
  - Validates passenger parsing across multiple passes
  - Validates field categorization (status, SSR, meals, types)

**E2E Tests:**
- Not implemented
- Manual QA would involve uploading PDFs via UI and verifying seat map output

## Common Patterns

**Async Testing:**
```javascript
async function main() {
  const result = await parsePDF(filepath);
  // validation
}
main().catch(console.error);
```

- `async/await` syntax
- Top-level catch handler via `.catch(console.error)`

**Data Validation:**
```javascript
const paxArr = Object.values(result.passengers);
const withStatus = paxArr.filter(p => p.status);
console.log(`With status (${withStatus.length} total), first 5:`);
withStatus.slice(0,5).forEach(p => console.log(JSON.stringify(p)));
```

- Filter collections by attribute
- Sample output (first N items) to keep logs readable
- JSON stringification for consistent inspection

**Error Testing:**
- Errors captured via try-catch
- Logged to console: `catch (e) { console.error("Error:", e); }`
- No formal error assertion; presence/absence of error determines pass/fail

## Parser Testing Strategy

**Tested Behaviors:**

1. **Flight Header Extraction** (`test-parser.js` line 213)
   - Validates: `flightNumber`, `date`, `origin`, `aircraftType`, `registration`
   - Output: `console.log('FlightInfo:', JSON.stringify(result.flightInfo));`

2. **Passenger Parsing** (`test-parser.js` lines 215-216)
   - Total count validation
   - Name parsing (first/last)
   - Seat number extraction
   - Cabin assignment (C/Y)

3. **Status Extraction** (`test-parser.js` lines 218-219)
   - Filters passengers with status codes: DIAM, GOLD, SILV, PLUS, CLIENTE TOP
   - Output: first 5 samples

4. **SSR Extraction** (`test-parser.js` lines 221-222)
   - Special Service Requests: WCHR, WCHC, WCHS, PETC, etc.
   - Validates comma-separated SSR strings

5. **Meal Extraction** (`test-parser.js` lines 224-225)
   - Special meal codes: GFML, MEML, FSML, PSML, VGML, etc.
   - Output: all passengers with meals

## Recommended Testing Improvements

Based on analysis, the following enhancements would improve test coverage:

1. **Install Vitest or Jest** for formalized testing
   - Enable automated CI/CD
   - Add assertions instead of manual inspection
   - Generate coverage reports

2. **Add Component Tests**
   - Test Dropzone file upload behavior
   - Test SeatMap selection and filtering
   - Test store mutations via useStore

3. **Add API Route Tests**
   - Test `/api/parse` endpoint with mock FormData
   - Test error handling for invalid PDFs
   - Test boundary conditions (empty PDFs, malformed structures)

4. **Formalize Test Data**
   - Create fixtures for edge cases
   - Add PDFs with missing sections
   - Add PDFs with malformed passenger data

---

*Testing analysis: 2026-05-07*
