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
    if (!manifest) return { emptySeats: 0, ssrCounts: {}, totalMeals: 0, totalPassengers: 0 };
    
    // Find config
    const configKey = Object.keys(AIRCRAFT_CONFIGS).find(key => 
      AIRCRAFT_CONFIGS[key].id.includes(manifest.aircraftType) || key.includes(manifest.aircraftType)
    ) || 'A320_STD';
    const config = AIRCRAFT_CONFIGS[configKey];

    // Total seats in config
    let totalSeatsInConfig = 0;
    config.elements.forEach(el => {
      if (el.type === 'cabin') {
        const layoutCols = el.layout.filter(c => c !== 'aisle').length;
        const totalRows = el.rows.length;
        const blocked = el.blockedSeats?.length || 0;
        totalSeatsInConfig += (layoutCols * totalRows) - blocked;
      }
    });

    const totalPassengers = manifest.passengers.length;
    const emptySeats = Math.max(0, totalSeatsInConfig - totalPassengers);

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

    return { emptySeats, ssrCounts, totalMeals, totalPassengers };
  },
}));
