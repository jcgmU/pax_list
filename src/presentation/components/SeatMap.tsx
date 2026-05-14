import React from 'react';
import { 
  Coffee, 
  Bath, 
  Box, 
  Accessibility, 
  Dog, 
  Utensils, 
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { AIRCRAFT_CONFIGS } from '../../domain/aircraftConfigs';
import type { AircraftElement } from '../../domain/aircraftConfigs';
import { FLIGHT_CODES } from '../../domain/flightCodes';

const IconMap: Record<string, any> = {
  coffee: Coffee,
  bath: Bath,
  box: Box
};

export const SeatMap: React.FC = () => {
  const { manifest, selectedSeat, setSelectedSeat, getPassengerBySeat, searchTerm } = useStore();
  
  if (!manifest) return null;

  // Buscar configuración del avión - Robust matching
  const acType = manifest.aircraftType.toUpperCase();
  let configKey = '';

  if (acType.includes('787') || acType.includes('788') || acType.includes('789') || acType.includes('B78')) {
    configKey = 'B788_STD';
  } else if (acType.includes('320') || acType.includes('32N') || acType.includes('32A')) {
    configKey = 'A320_STD';
  } else if (acType.includes('319')) {
    configKey = 'A319_STD';
  } else {
    configKey = Object.keys(AIRCRAFT_CONFIGS).find(key => 
      acType.includes(key.split('_')[0]) || key.includes(acType)
    ) || 'A320_STD';
  }

  const config = AIRCRAFT_CONFIGS[configKey];

  return (
    <div className="flex flex-col lg:flex-row w-full h-full gap-6 fade-in overflow-hidden">
      {/* Flight Header (Mobile only, visible on top of map) */}
      <div className="lg:hidden px-4 py-3 bg-white border-b flex justify-between items-center">
        <div>
          <h2 className="font-bold text-[#E20613]">{manifest.flightNumber}</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{config.id}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-700">{manifest.date}</p>
        </div>
      </div>

      {/* Map Scroll Area */}
      <div className="flex-1 overflow-x-auto lg:overflow-y-auto pb-20 lg:pb-0 scrollbar-hide">
        <div className="min-w-max lg:min-w-0 flex flex-col items-center p-8 bg-slate-50">
          <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-slate-200 p-8 flex flex-col gap-4">
            {config.elements.map((element, idx) => (
              <RenderElement 
                key={`${config.id}-${idx}`} 
                element={element} 
                getPassenger={getPassengerBySeat}
                selectedSeat={selectedSeat}
                onSelect={setSelectedSeat}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RenderElement: React.FC<{ 
  element: AircraftElement; 
  getPassenger: (seat: string) => any;
  selectedSeat: string | null;
  onSelect: (seat: string) => void;
  searchTerm: string;
}> = ({ element, getPassenger, selectedSeat, onSelect, searchTerm }) => {
  
  if (element.type === 'facility') {
    const isOWE = element.doors.includes('OWE');
    return (
      <div className="relative w-full py-6 flex flex-col items-center">
        {/* Doors indicators */}
        <div className="absolute left-[-32px] top-1/2 -translate-y-1/2 w-2 h-12 bg-[#E20613] rounded-r-lg shadow-sm" title={element.doors}></div>
        <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 w-2 h-12 bg-[#E20613] rounded-l-lg shadow-sm" title={element.doors}></div>
        
        {/* Central Facility Container (only if components exist) */}
        {element.components.length > 0 && (
          <div className="w-full max-w-sm bg-slate-100 rounded-2xl p-4 flex justify-around items-center border border-slate-200">
            {element.components.map((comp, i) => {
              const Icon = IconMap[comp.icon] || Coffee;
              return (
                <div key={i} className="flex flex-col items-center gap-1 text-slate-400">
                  <Icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{comp.label}</span>
                </div>
              );
            })}
          </div>
        )}
        
        {isOWE && element.components.length === 0 && (
           <div className="w-full border-t-2 border-dashed border-red-200 my-2"></div>
        )}
      </div>
    );
  }

  // Cabin Rendering
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 text-center">
        {element.class} Class
      </div>
      
      {element.rows.map(rowNum => (
        <div key={rowNum} className="flex justify-center items-center gap-1.5 h-11">
          {/* Row Number Label */}
          <div className="w-6 text-[10px] font-bold text-slate-400 text-center">{rowNum}</div>
          
          {element.layout.map((col, cIdx) => {
            if (col === 'aisle') {
              return <div key={`aisle-${cIdx}`} className="w-6" />;
            }

            const seatId = `${rowNum}${col}`;
            const passenger = getPassenger(seatId);
            const isSelected = selectedSeat === seatId;
            const isBlocked = element.blockedSeats?.includes(seatId);
            
            // Search highlighting logic
            let isHighlighted = false;
            if (searchTerm.length >= 2) {
              const term = searchTerm.toUpperCase();
              if (seatId.includes(term)) {
                isHighlighted = true;
              } else if (passenger) {
                const fullName = `${passenger.firstName} ${passenger.lastName}`.toUpperCase();
                if (fullName.includes(term)) {
                  isHighlighted = true;
                }
              }
            }

            return (
              <Seat 
                key={seatId} 
                id={seatId} 
                passenger={passenger} 
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isBlocked={isBlocked}
                onClick={() => !isBlocked && onSelect(seatId)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Seat: React.FC<{
  id: string;
  passenger?: any;
  isSelected: boolean;
  isHighlighted?: boolean;
  isBlocked?: boolean;
  onClick: () => void;
}> = ({ id, passenger, isSelected, isHighlighted, isBlocked, onClick }) => {
  
  // Determinación de color de fondo según reglas
  let bgColor = 'bg-slate-200'; // Libre
  let textColor = 'text-slate-400';

  if (isBlocked) {
    bgColor = 'bg-slate-800 opacity-20 cursor-not-allowed';
    textColor = 'text-transparent';
  } else if (passenger) {
    textColor = 'text-white';
    if (passenger.status === 'DIAM' || passenger.status === 'D') {
      bgColor = 'bg-slate-900';
    } else if (passenger.status === 'GOLD' || passenger.status === 'G') {
      bgColor = 'bg-amber-400';
      textColor = 'text-slate-900';
    } else {
      bgColor = 'bg-[#E20613]/10';
      textColor = 'text-[#E20613] font-black';
    }
  }

  let ringClasses = '';
  if (isSelected) {
    ringClasses = 'ring-4 ring-[#E20613] ring-offset-2 z-10';
  } else if (isHighlighted) {
    ringClasses = 'ring-4 ring-amber-400 ring-offset-1 z-10 animate-pulse';
  }

  // Identificación de Badges SSR
  const hasWheelchair = passenger?.codes.some((c: string) => ['WCHR', 'WCHS', 'WCHC', 'WCMP', 'WCOB'].includes(c));
  const hasPet = passenger?.codes.some((c: string) => ['PETC', 'SVAN', 'ESAN'].includes(c));
  const hasMeal = passenger?.codes.some((c: string) => Object.keys(FLIGHT_CODES.MEALS).includes(c));
  const hasMedicalLegal = passenger?.codes.some((c: string) => 
    Object.keys(FLIGHT_CODES.MEDICAL).includes(c) || Object.keys(FLIGHT_CODES.LEGAL).includes(c)
  );

  return (
    <button 
      onClick={onClick}
      className={`
        relative w-10 h-10 rounded-lg transition-all duration-200 active:scale-95
        flex items-center justify-center text-[11px] font-bold shadow-sm
        ${bgColor} ${textColor} ${ringClasses}
      `}
    >
      {id}

      {/* Badges Layout */}
      <div className="absolute -top-1.5 -right-1.5 flex flex-col gap-0.5">
        {hasWheelchair && (
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white shadow-sm">
            <Accessibility size={8} strokeWidth={3} />
          </div>
        )}
        {hasPet && (
          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white shadow-sm">
            <Dog size={8} strokeWidth={3} />
          </div>
        )}
        {hasMeal && (
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white shadow-sm">
            <Utensils size={8} strokeWidth={3} />
          </div>
        )}
        {hasMedicalLegal && (
          <div className="w-4 h-4 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-sm">
            <AlertCircle size={8} strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
};
