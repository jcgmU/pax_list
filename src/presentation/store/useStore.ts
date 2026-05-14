import { create } from 'zustand';
import type { FlightManifest, ParsedPassenger } from '../../infrastructure/pdfParser';

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
    if (!manifest) return { emptySeats: 0, ssrCounts: {}, totalMeals: 0 };
    
    // This is a placeholder for actual calculation logic which depends on AircraftConfig
    // For now, return empty/zero
    return { emptySeats: 0, ssrCounts: {}, totalMeals: 0 };
  },
}));
