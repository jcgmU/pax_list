import React from 'react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { Users, Utensils, Accessibility, Info } from 'lucide-react';
import { FLIGHT_CODES } from '../../domain/flightCodes';

export const StatsSidebar: React.FC = () => {
  const { manifest } = useStore();
  if (!manifest) return null;

  // Simple stats calculation
  const totalPassengers = manifest.passengers.length;
  const ssrCount = manifest.passengers.reduce((acc, p) => acc + p.codes.length, 0);
  const mealCount = manifest.passengers.filter(p => 
    p.codes.some(c => Object.keys(FLIGHT_CODES.MEALS).includes(c))
  ).length;

  return (
    <aside className="hidden lg:flex flex-col w-80 h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-xl border border-slate-200 m-4 p-6 overflow-y-auto scrollbar-hide">
      <h2 className="text-[#E20613] font-black text-xl mb-6 uppercase italic tracking-tighter">Estadísticas</h2>
      
      <SearchBar />
      
      <div className="space-y-4">
        <StatCard 
          icon={<Users size={20}/>} 
          label="Pasajeros" 
          value={totalPassengers} 
          color="bg-slate-100 text-slate-600" 
        />
        <StatCard 
          icon={<Accessibility size={20}/>} 
          label="Servicios Especiales" 
          value={ssrCount} 
          color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          icon={<Utensils size={20}/>} 
          label="Comidas Solicitadas" 
          value={mealCount} 
          color="bg-green-100 text-green-600" 
        />
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Información del Vuelo</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Vuelo</span>
            <span className="text-sm font-black text-[#E20613]">{manifest.flightNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Fecha</span>
            <span className="text-sm font-bold text-slate-700">{manifest.date}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Equipo</span>
            <span className="text-sm font-bold text-slate-700">{manifest.aircraftType}</span>
          </div>
        </div>
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
