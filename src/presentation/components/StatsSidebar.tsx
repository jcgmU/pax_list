import React from 'react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { Users, Utensils, Accessibility, Info } from 'lucide-react';
import { FLIGHT_CODES } from '../../domain/flightCodes';

export const StatsSidebar: React.FC = () => {
  const { manifest, getFlightStats } = useStore();
  if (!manifest) return null;

  const { emptySeats, ssrCounts, totalMeals, totalPassengers } = getFlightStats();

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
          icon={<Users size={20}/>} 
          label="Sillas Vacías" 
          value={emptySeats} 
          color="bg-slate-900 text-white" 
        />
        <StatCard 
          icon={<Accessibility size={20}/>} 
          label="Servicios Especiales" 
          value={Object.values(ssrCounts).reduce((a, b) => a + b, 0)} 
          color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          icon={<Utensils size={20}/>} 
          label="Comidas Solicitadas" 
          value={totalMeals} 
          color="bg-green-100 text-green-600" 
        />
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Servicios por Código</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(ssrCounts).map(([code, count]) => (
            <div key={code} className="bg-slate-50 p-2 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500">{code}</span>
              <span className="text-xs font-black text-slate-700">{count}</span>
            </div>
          ))}
          {Object.keys(ssrCounts).length === 0 && (
            <p className="col-span-2 text-[10px] text-slate-400 italic">No hay SSRs registrados</p>
          )}
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
