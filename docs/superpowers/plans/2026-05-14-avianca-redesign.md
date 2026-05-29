# Avianca SeatMap Pro Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the application to use Avianca's branding, improve parsing accuracy, and refactor the UI to use a modal-based passenger detail view with a statistics-focused sidebar.

**Architecture:** Use Zustand for state management (adding search and counters), refactor `pdfParser.ts` for higher accuracy, and update the component tree to separate global stats (Sidebar) from individual passenger data (Modal).

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide-React, Zustand.

---

### Task 1: Update State Management (useStore.ts)

**Files:**
- Modify: `src/presentation/store/useStore.ts`

- [ ] **Step 1: Add searchTerm and getStats to useStore**
Update the state interface and implementation to include search functionality and a getter for flight statistics.

```typescript
// Add to interface
searchTerm: string;
setSearchTerm: (term: string) => void;
getFlightStats: () => { 
  emptySeats: number; 
  ssrCounts: Record<string, number>; 
  totalMeals: number; 
};

// Implement in create()
searchTerm: '',
setSearchTerm: (term) => set({ searchTerm: term }),
getFlightStats: () => {
  const { manifest } = get();
  if (!manifest) return { emptySeats: 0, ssrCounts: {}, totalMeals: 0 };
  
  // This is a placeholder for actual calculation logic which depends on AircraftConfig
  // For now, return empty/zero
  return { emptySeats: 0, ssrCounts: {}, totalMeals: 0 };
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/presentation/store/useStore.ts
git commit -m "chore: add search and stats placeholders to store"
```

---

### Task 2: Fix PDF Parsing Logic (pdfParser.ts)

**Files:**
- Modify: `src/infrastructure/pdfParser.ts`

- [ ] **Step 1: Fix Flight Number Regex and Name Ignore List**
Update the regex to be more restrictive and add common destination codes to the ignore list.

```typescript
// Modify L62
const flightMatch = rawTextJoined.match(/\bAV\s?\d{2,4}\b/i);

// Modify L119 (ignoreList)
const ignoreList = [
  'BOG', 'MAD', 'CLO', 'JFK', 'MIA', 'LHR', 'CTG', 'MED', 'BCN', 'LAX', 'PTY', 'SCL', 'LIM', 'GRU', 'EZE', 'MEX', 'CUN', 'SAL', 'GUA', 'UIO', 'GYE', 
  'C', 'Y', 'TO', 'FROM', 'VIA', 'DEST'
];
```

- [ ] **Step 2: Commit changes**

```bash
git add src/infrastructure/pdfParser.ts
git commit -m "fix: improve flight number extraction and name filtering"
```

---

### Task 3: Adjust Aircraft Layout (aircraftConfigs.ts)

**Files:**
- Modify: `src/domain/aircraftConfigs.ts`

- [ ] **Step 1: Remove bathrooms from B787-8 Mid Galley**
Identify the L2/R2 facility and remove the 'bath' components.

```typescript
// In B788_STD and B788_EXNAS
{ type: 'facility', doors: 'L2 / R2', components: [{ icon: 'coffee', label: 'Mid Galley' }] }
```

- [ ] **Step 2: Commit changes**

```bash
git add src/domain/aircraftConfigs.ts
git commit -m "fix: adjust B787 layout (remove baths from mid galley)"
```

---

### Task 4: Create SearchBar Component

**Files:**
- Create: `src/presentation/components/SearchBar.tsx`

- [ ] **Step 1: Implement SearchBar with Lucide Search icon**
```tsx
import React from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../store/useStore';

export const SearchBar: React.FC = () => {
  const { searchTerm, setSearchTerm } = useStore();
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        placeholder="Buscar nombre o asiento..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#E20613] transition-all"
      />
    </div>
  );
};
```

- [ ] **Step 2: Commit changes**

```bash
git add src/presentation/components/SearchBar.tsx
git commit -m "feat: add SearchBar component"
```

---

### Task 5: Refactor Sidebar to Stats View (StatsSidebar.tsx)

**Files:**
- Rename: `src/presentation/components/PassengerPanel.tsx` -> `src/presentation/components/StatsSidebar.tsx`
- Modify: `src/presentation/components/StatsSidebar.tsx`

- [ ] **Step 1: Rename and Refactor to show global stats**
Remove passenger specific logic and implement counters.

```tsx
import React from 'react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { Users, Utensils, Info } from 'lucide-react';

export const StatsSidebar: React.FC = () => {
  const { manifest } = useStore();
  if (!manifest) return null;

  // Real stats calculation would go here or in store
  return (
    <aside className="hidden lg:flex flex-col w-80 h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-xl border border-slate-200 m-4 p-6">
      <h2 className="text-[#E20613] font-black text-xl mb-6 uppercase italic tracking-tighter">Estadísticas</h2>
      <SearchBar />
      
      <div className="space-y-4">
        <StatCard icon={<Users size={20}/>} label="Sillas Vacías" value="--" color="bg-slate-100 text-slate-600" />
        <StatCard icon={<Utensils size={20}/>} label="Comidas Especiales" value="--" color="bg-green-100 text-green-600" />
      </div>
    </aside>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className={`p-4 rounded-2xl flex items-center justify-between ${color}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </div>
    <span className="text-lg font-black">{value}</span>
  </div>
);
```

- [ ] **Step 2: Commit changes**

```bash
git add src/presentation/components/StatsSidebar.tsx
git commit -m "feat: refactor sidebar to show stats"
```

---

### Task 6: Implement Passenger Details Modal

**Files:**
- Create: `src/presentation/components/PassengerModal.tsx`

- [ ] **Step 1: Implement Modal using logic from former PassengerPanel**
Ensure it uses Avianca Red for the header and has a clear close button.

- [ ] **Step 2: Commit changes**

```bash
git add src/presentation/components/PassengerModal.tsx
git commit -m "feat: add PassengerModal for details"
```

---

### Task 7: Final UI Integration and Branding

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/presentation/components/SeatMap.tsx`
- Modify: `src/presentation/components/Seat.tsx` (if extracted)

- [ ] **Step 1: Update colors in SeatMap and Seat components**
Change blue/slate references to `#E20613`. Implement highlighting logic for searched seats.

- [ ] **Step 2: Final Commit**

```bash
git add src/App.tsx src/presentation/components/SeatMap.tsx
git commit -m "feat: finalize avianca branding and component integration"
```
