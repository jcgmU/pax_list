import React, { useState } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { parsePaxListPDF } from '../../infrastructure/pdfParser';

export const Dropzone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { setManifest, setLoading, setError, isLoading } = useStore();

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF de manifiestos.');
      return;
    }

    setLoading(true);
    try {
      const result = await parsePaxListPDF(file);
      setManifest(result);
    } catch (err) {
      console.error(err);
      setError('Error al procesar el PDF. Asegúrate de que sea un PAXLIST válido.');
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-96">
      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-full 
          border-2 border-dashed rounded-3xl cursor-pointer 
          transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-[#E20613] bg-red-50 scale-[1.02]' 
            : 'border-slate-300 bg-white hover:bg-slate-50'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isLoading ? (
            <>
              <Loader2 className="w-16 h-16 mb-4 text-[#E20613] animate-spin" />
              <p className="text-xl font-semibold text-slate-700">Procesando Manifiesto...</p>
              <p className="text-sm text-slate-500">Extrayendo datos de pasajeros</p>
            </>
          ) : (
            <>
              <div className="p-4 mb-4 bg-red-50 rounded-full text-[#E20613]">
                <UploadCloud className="w-12 h-12" />
              </div>
              <p className="mb-2 text-2xl font-black text-slate-800 italic">Avianca <span className="text-[#E20613] not-italic">SeatMap Pro</span></p>
              <p className="mb-4 text-sm text-slate-500 text-center px-8 font-medium">
                Arrastra aquí el PDF del <strong>PAXLIST</strong> o haz clic para seleccionar
              </p>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-600 font-medium">
                <FileText size={18} />
                <span>Formatos admitidos: .pdf</span>
              </div>
            </>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="application/pdf" 
          onChange={onFileChange} 
        />
      </label>
      
      <div className="mt-6 flex gap-4 text-xs text-slate-400 font-medium uppercase tracking-widest">
        <span>Zero Data Retention</span>
        <span>•</span>
        <span>100% Client-Side</span>
      </div>
    </div>
  );
};
