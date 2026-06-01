import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { Users, Utensils, Accessibility, Baby, BarChart2, ChevronDown } from 'lucide-react';

export const StatsSidebar: React.FC = () => {
  const { manifest, getFlightStats } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (!manifest) return null;

  const { emptySeats, ssrCounts, totalMeals, totalPassengers, infantCount } = getFlightStats();
  const totalSSR = Object.values(ssrCounts).reduce((a, b) => a + b, 0);

  const handleCodeClick = (code: string) => {
    setExpandedCode(prev => (prev === code ? null : code));
  };

  const getPassengersForCode = (code: string) =>
    manifest.passengers
      .filter(p => p.codes.includes(code))
      .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  return (
    <>
      {/* Desktop (lg+): sidebar lateral */}
      <aside className="hidden lg:flex flex-col w-80 h-full bg-white rounded-3xl shadow-xl border border-slate-200 m-4 p-6 overflow-hidden">
        <h2 className="text-[#E20613] font-black text-xl mb-6 uppercase italic tracking-tighter shrink-0">Estadísticas</h2>

        <SearchBar />

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pr-1">
          <StatCard
            icon={<Users size={20}/>}
            label="Pasajeros (Sillas)"
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
            icon={<Baby size={20}/>}
            label="Infantes (INF)"
            value={infantCount}
            color="bg-amber-100 text-amber-700"
          />
          <StatCard
            icon={<Accessibility size={20}/>}
            label="Servicios Especiales"
            value={totalSSR}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={<Utensils size={20}/>}
            label="Comidas Solicitadas"
            value={totalMeals}
            color="bg-green-100 text-green-600"
          />

          {/* Servicios por Código — desktop interactive */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Servicios por Código</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ssrCounts).map(([code, count]) => (
                <div key={code} className="flex flex-col">
                  <button
                    onClick={() => handleCodeClick(code)}
                    className="bg-slate-50 hover:bg-slate-100 cursor-pointer p-2 rounded-xl flex justify-between items-center transition-colors"
                  >
                    <span className="text-[10px] font-bold text-slate-500">{code}</span>
                    <span className="text-xs font-black text-slate-700">{count}</span>
                  </button>
                  {expandedCode === code && (
                    <div className="mt-1 bg-slate-100 rounded-lg px-2 py-1.5 space-y-0.5">
                      {getPassengersForCode(code).map(p => (
                        <p key={p.seat} className="text-[11px] text-slate-700 truncate">
                          {p.seat} — {p.lastName}, {p.firstName}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {Object.keys(ssrCounts).length === 0 && (
                <p className="col-span-2 text-[10px] text-slate-400 italic">No hay SSRs registrados</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center">
            Avianca SeatMap Pro v1.1
          </p>
        </div>
      </aside>

      {/* Mobile/Tablet (< lg): barra sticky fixed que expande hacia arriba */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Panel expansible (encima de la barra) */}
        {isOpen && (
          <div className="max-h-[70vh] overflow-y-auto px-4 pb-4 pt-4 space-y-3 bg-white border-t border-slate-100">
            {/* SearchBar */}
            <SearchBar />

            {/* Stat Cards grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Users size={16}/>}
                label="Pasajeros"
                value={totalPassengers}
                color="bg-slate-100 text-slate-600"
              />
              <StatCard
                icon={<Users size={16}/>}
                label="Vacías"
                value={emptySeats}
                color="bg-slate-900 text-white"
              />
              <StatCard
                icon={<Baby size={16}/>}
                label="Infantes"
                value={infantCount}
                color="bg-amber-100 text-amber-700"
              />
              <StatCard
                icon={<Accessibility size={16}/>}
                label="SSR"
                value={totalSSR}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard
                icon={<Utensils size={16}/>}
                label="Comidas"
                value={totalMeals}
                color="bg-green-100 text-green-600"
              />
            </div>

            {/* Servicios por Código — móvil interactive */}
            {Object.keys(ssrCounts).length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Servicios por Código</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ssrCounts).map(([code, count]) => (
                    <div key={code} className="flex flex-col">
                      <button
                        onClick={() => handleCodeClick(code)}
                        className="bg-slate-50 hover:bg-slate-200 cursor-pointer p-2 rounded-xl flex justify-between items-center transition-colors"
                      >
                        <span className="text-[10px] font-bold text-slate-500">{code}</span>
                        <span className="text-xs font-black text-slate-700">{count}</span>
                      </button>
                      {expandedCode === code && (
                        <div className="mt-1 bg-slate-100 rounded-lg px-2 py-1.5 space-y-0.5 col-span-3">
                          {getPassengersForCode(code).map(p => (
                            <p key={p.seat} className="text-[11px] text-slate-700 truncate">
                              {p.seat} — {p.lastName}, {p.firstName}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Barra trigger siempre visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 h-14"
        >
          <span className="flex items-center gap-2">
            <BarChart2 size={18} className="text-[#E20613]" />
            <span className="font-black uppercase italic tracking-tighter text-[#E20613]">ESTADÍSTICAS</span>
          </span>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <div className={`p-4 rounded-2xl flex items-center justify-between ${color}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </div>
    <span className="text-lg font-black">{value}</span>
  </div>
);
