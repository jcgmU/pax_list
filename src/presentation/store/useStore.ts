import { create } from 'zustand';
import type { FlightManifest, ParsedPassenger } from '../../infrastructure/pdfParser';
import { AIRCRAFT_CONFIGS } from '../../domain/aircraftConfigs';
import { FLIGHT_CODES } from '../../domain/flightCodes';

interface AppState {
  manifest: FlightManifest | null;
  selectedSeat: string | null;
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setManifest: (manifest: FlightManifest | null) => void;
  setSelectedSeat: (seat: string | null) => void;
  setSearchTerm: (term: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // Getters
  getPassengerBySeat: (seat: string) => ParsedPassenger | undefined;
  getFlightStats: () => { 
    emptySeats: number; 
    ssrCounts: Record<string, number>; 
    totalMeals: number; 
    totalPassengers: number;
  };
}

export const useStore = create<AppState>((set, get) => ({
  manifest: null,
  selectedSeat: null,
  searchTerm: '',
  isLoading: false,
  error: null,

  setManifest: (manifest) => set({ manifest, error: null }),
  setSelectedSeat: (seat) => set({ selectedSeat: seat }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  reset: () => set({ manifest: null, selectedSeat: null, searchTerm: '', error: null, isLoading: false }),

  getPassengerBySeat: (seat) => {
    return get().manifest?.passengers.find((p) => p.seat === seat);
  },

  getFlightStats: () => {
    const { manifest } = get();
    if (!manifest) return { emptySeats: 0, ssrCounts: {}, totalMeals: 0, totalPassengers: 0, infantCount: 0 };
    
    // Find config - Robust matching
    const acType = manifest.aircraftType.toUpperCase();
    let configKey = '';

    if (acType.includes('787') || acType.includes('788') || acType.includes('789') || acType.includes('B78')) {
      configKey = 'B788_STD';
    } else if (acType.includes('320') || acType.includes('32N') || acType.includes('32A')) {
      configKey = 'A320_STD';
    } else if (acType.includes('319')) {
      // Check for specific A319 if possible, else default
      configKey = 'A319_STD';
    } else {
      // Fallback: try to find any key that matches
      configKey = Object.keys(AIRCRAFT_CONFIGS).find(key => 
        acType.includes(key.split('_')[0]) || key.includes(acType)
      ) || 'A320_STD';
    }

    const config = AIRCRAFT_CONFIGS[configKey];

    // Total seats in config (excluding blocked)
    let totalSeatsInConfig = 0;
    config.elements.forEach(el => {
      if (el.type === 'cabin') {
        const layoutCols = el.layout.filter(c => c !== 'aisle').length;
        const totalRows = el.rows.length;
        const blocked = el.blockedSeats?.length || 0;
        totalSeatsInConfig += (layoutCols * totalRows) - blocked;
      }
    });

    const seatedPassengers = manifest.passengers.length;
    const emptySeats = Math.max(0, totalSeatsInConfig - seatedPassengers);

    // SSR Counts
    const ssrCounts: Record<string, number> = {};
    manifest.passengers.forEach(p => {
      p.codes.forEach(code => {
        ssrCounts[code] = (ssrCounts[code] || 0) + 1;
      });
    });

    // Total Meals
    const mealCodes = Object.keys(FLIGHT_CODES.MEALS);
    const totalMeals = manifest.passengers.filter(p => 
      p.codes.some(c => mealCodes.includes(c))
    ).length;

    return { 
      emptySeats, 
      ssrCounts, 
      totalMeals, 
      totalPassengers: seatedPassengers,
      infantCount: manifest.infantCount || 0
    };
  },
}));
