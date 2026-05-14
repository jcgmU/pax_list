import React from 'react';
import { X, User, Star, Utensils, Accessibility, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FLIGHT_CODES } from '../../domain/flightCodes';

export const PassengerModal: React.FC = () => {
  const { selectedSeat, setSelectedSeat, getPassengerBySeat } = useStore();
  
  if (!selectedSeat) return null;

  const passenger = getPassengerBySeat(selectedSeat);

  const getCodeDescription = (code: string) => {
    for (const category of Object.values(FLIGHT_CODES)) {
      if ((category as any)[code]) return (category as any)[code];
    }
    return 'Requerimiento especial';
  };

  const close = () => setSelectedSeat(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-[#E20613] flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{selectedSeat}</h3>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Detalles del Pasajero</p>
            </div>
          </div>
          <button 
            onClick={close}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {!passenger ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Info size={32} />
              </div>
              <p className="text-slate-400 font-medium">Este asiento está vacío</p>
            </div>
          ) : (
            <>
              {/* Passenger Name */}
              <section>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Pasajero</label>
                <div className="text-3xl font-black text-slate-900 leading-tight">
                  {passenger.lastName}, <span className="text-[#E20613]">{passenger.firstName}</span>
                </div>
              </section>

              {/* Loyalty Status */}
              <section className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus LifeMiles</span>
                </div>
                {passenger.status ? (
                  <div className="flex items-center gap-3">
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-black uppercase
                      ${(passenger.status === 'DIAM' || passenger.status === 'D') ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-700'}
                    `}>
                      {passenger.status}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{getCodeDescription(passenger.status)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">Sin estatus frecuente</span>
                )}
              </section>

              {/* SSR Codes & Special Requirements */}
              <section className="space-y-4">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Requerimientos Especiales</label>
                
                {passenger.codes.length > 0 ? (
                  <div className="grid gap-3">
                    {passenger.codes.map(code => {
                      const desc = getCodeDescription(code);
                      let Icon = Info;
                      let iconColor = 'bg-slate-100 text-slate-500';

                      if (['WCHR', 'WCHS', 'WCHC', 'WCMP', 'WCOB'].includes(code)) {
                        Icon = Accessibility;
                        iconColor = 'bg-blue-100 text-blue-600';
                      } else if (Object.keys(FLIGHT_CODES.MEALS).includes(code)) {
                        Icon = Utensils;
                        iconColor = 'bg-green-100 text-green-600';
                      } else if (Object.keys(FLIGHT_CODES.MEDICAL).includes(code) || Object.keys(FLIGHT_CODES.LEGAL).includes(code)) {
                        Icon = AlertCircle;
                        iconColor = 'bg-rose-100 text-rose-600';
                      }

                      return (
                        <div key={code} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-[#E20613]/20 transition-colors">
                          <div className={`p-2.5 rounded-xl ${iconColor}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{code}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center">
                    <p className="text-xs text-slate-400 italic">No hay servicios especiales registrados</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
            Información Confidencial • Solo para uso operativo
          </p>
        </div>
      </div>
    </div>
  );
};
