import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { Users, Utensils, Accessibility, Baby, BarChart2, ChevronDown, Star, Diamond } from 'lucide-react';

export const StatsSidebar: React.FC = () => {
  const { manifest, getFlightStats } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (!manifest) return null;

  const { emptySeats, ssrCounts, totalMeals, totalPassengers, infantCount } = getFlightStats();
  const totalSSR = Object.values(ssrCounts).reduce((a, b) => a + b, 0);

  const diamondPax = manifest.passengers
    .filter(p => ['DIAM', 'D'].includes(p.status ?? ''))
    .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  const goldPax = manifest.passengers
    .filter(p => ['GOLD', 'G'].includes(p.status ?? ''))
    .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  const paxTopCount = diamondPax.length + goldPax.length;

  const handleCodeClick = (code: string) => {
    setExpandedCode(prev => (prev === code ? null : code));
  };

  const getPassengersForCode = (code: string) =>
    manifest.passengers
      .filter(p => p.codes.includes(code))
      .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  const SSRSection = ({ cols }: { cols: 2 | 3 }) => (
    <div className="mt-6 pt-4 border-t border-slate-100">
      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Servicios por Código</h3>
      <div className={`grid grid-cols-${cols} gap-2`}>
        {Object.entries(ssrCounts).map(([code, count]) => (
          <button
            key={code}
            onClick={() => handleCodeClick(code)}
            className={`bg-slate-50 hover:bg-slate-100 cursor-pointer p-2 rounded-xl flex justify-between items-center transition-colors ${expandedCode === code ? 'ring-2 ring-[#E20613]/30 bg-slate-100' : ''}`}
          >
            <span className="text-[10px] font-bold text-slate-500">{code}</span>
            <span className="text-xs font-black text-slate-700">{count}</span>
          </button>
        ))}
        {Object.keys(ssrCounts).length === 0 && (
          <p className="col-span-2 text-[10px] text-slate-400 italic">No hay SSRs registrados</p>
        )}
      </div>

      {/* Panel expandido — fuera del grid, full-width, animado */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expandedCode ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        {expandedCode && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{expandedCode}</span>
              <span className="text-[10px] font-bold text-slate-400">{ssrCounts[expandedCode]} pasajeros</span>
            </div>
            <div className="space-y-1">
              {getPassengersForCode(expandedCode).map(p => (
                <p key={p.seat} className="text-[11px] text-slate-700 break-words leading-relaxed">
                  <span className="font-black text-slate-900">{p.seat}</span>
                  {' — '}
                  {p.lastName}, {p.firstName}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const EliteSection = () => {
    if (diamondPax.length === 0 && goldPax.length === 0) return null;
    return (
      <div className="mt-6 pt-4 border-t border-slate-100">
        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Pasajeros Elite</h3>
        {diamondPax.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 rounded-lg mb-1.5">
              <Diamond size={10} className="text-white shrink-0" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Diamond</span>
              <span className="ml-auto text-[9px] font-black text-slate-400">{diamondPax.length}</span>
            </div>
            <div className="space-y-0.5 pl-1">
              {diamondPax.map(p => (
                <p key={p.seat} className="text-[11px] text-slate-700 break-words leading-relaxed">
                  <span className="font-black text-slate-900">{p.seat}</span>
                  {' — '}
                  {p.lastName}, {p.firstName}
                </p>
              ))}
            </div>
          </div>
        )}
        {goldPax.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-400 rounded-lg mb-1.5">
              <Star size={10} className="text-slate-900 shrink-0 fill-slate-900" />
              <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Gold</span>
              <span className="ml-auto text-[9px] font-black text-slate-700">{goldPax.length}</span>
            </div>
            <div className="space-y-0.5 pl-1">
              {goldPax.map(p => (
                <p key={p.seat} className="text-[11px] text-slate-700 break-words leading-relaxed">
                  <span className="font-black text-slate-900">{p.seat}</span>
                  {' — '}
                  {p.lastName}, {p.firstName}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop (lg+): sidebar lateral */}
      <aside className="hidden lg:flex flex-col w-80 h-full bg-white rounded-3xl shadow-xl border border-slate-200 m-4 p-6 overflow-hidden">
        <h2 className="text-[#E20613] font-black text-xl mb-6 uppercase italic tracking-tighter shrink-0">Estadísticas</h2>

        <SearchBar />

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pr-1">
          <StatCard
            icon={<Users size={20}/>}
            label="Pasajeros a bordo"
            value={totalPassengers}
            color="bg-slate-100 text-slate-600"
          />
          <StatCard
            icon={<Users size={20}/>}
            label="Sillas Vacías"
            value={emptySeats}
            color="bg-indigo-100 text-indigo-700"
          />
          <StatCard
            icon={<Baby size={20}/>}
            label="Infantes (INF)"
            value={infantCount}
            color="bg-sky-100 text-sky-700"
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
          {paxTopCount > 0 && (
            <StatCard
              icon={<Star size={20}/>}
              label="Pax Top (Elite)"
              value={paxTopCount}
              color="bg-slate-800 text-white"
            />
          )}

          <SSRSection cols={2} />
          <EliteSection />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center">
            Avianca SeatMap Pro v1.1
          </p>
        </div>
      </aside>

      {/* Mobile/Tablet (< lg): barra sticky fixed que expande hacia arriba */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Panel expansible — animado con max-height */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="overflow-y-auto max-h-[70vh] px-4 pb-4 pt-4 space-y-3 bg-white border-t border-slate-100">
            <SearchBar />

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Users size={16}/>}
                label="Pax a bordo"
                value={totalPassengers}
                color="bg-slate-100 text-slate-600"
              />
              <StatCard
                icon={<Users size={16}/>}
                label="Vacías"
                value={emptySeats}
                color="bg-indigo-100 text-indigo-700"
              />
              <StatCard
                icon={<Baby size={16}/>}
                label="Infantes"
                value={infantCount}
                color="bg-sky-100 text-sky-700"
              />
              <StatCard
                icon={<Accessibility size={16}/>}
                label="Especiales"
                value={totalSSR}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard
                icon={<Utensils size={16}/>}
                label="Comidas"
                value={totalMeals}
                color="bg-green-100 text-green-600"
              />
              {paxTopCount > 0 && (
                <StatCard
                  icon={<Star size={16}/>}
                  label="Pax Top"
                  value={paxTopCount}
                  color="bg-slate-800 text-white"
                />
              )}
            </div>

            {Object.keys(ssrCounts).length > 0 && <SSRSection cols={3} />}
            <EliteSection />
          </div>
        </div>

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
