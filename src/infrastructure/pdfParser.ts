import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FLIGHT_CODES } from '../domain/flightCodes';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ParsedPassenger {
  seat: string;
  firstName: string;
  lastName: string;
  status?: string;
  codes: string[];
  rawText: string;
}

export interface FlightManifest {
  flightNumber: string;
  date: string;
  aircraftType: string;
  passengers: ParsedPassenger[];
  infantCount: number;
}

const normalizeSeat = (rawSeat: string): string => {
  return rawSeat.replace(/^0+/, '');
};

export const parsePaxListPDF = async (file: File): Promise<FlightManifest> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const fullTextLines: string[] = [];
  
  // Paso 1: Extraer el texto con agrupación heurística de coordenadas Y (Formando líneas reales)
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    const linesMap = new Map<number, { str: string; x: number }[]>();
    
    content.items.forEach((item: any) => {
      if (!item.str.trim()) return;
      // Tolerancia de 4px para considerar que están en la misma línea
      const y = Math.round(item.transform[5] / 4) * 4; 
      if (!linesMap.has(y)) linesMap.set(y, []);
      linesMap.get(y)!.push({ str: item.str, x: item.transform[4] });
    });

    const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a); // Y desciende
    
    sortedY.forEach(y => {
      const rowItems = linesMap.get(y)!;
      rowItems.sort((a, b) => a.x - b.x); // Ordenar de izquierda a derecha
      const lineText = rowItems.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
      fullTextLines.push(lineText);
    });
  }

  // Paso 2: Extraer metadatos del vuelo
  const rawTextJoined = fullTextLines.join('\n');
  
  // Usamos el texto con espacios para no fusionar el vuelo con la fecha (ej. AV1822026...)
  const flightMatch = rawTextJoined.match(/\bAV\s?\d{2,4}\b/i);
  const dateMatch = rawTextJoined.replace(/\s+/g, '').match(/202[0-9]{5}/); // Asume años 202x
  // Mejorado: Buscar 787, 788, 789, 320, 319, 32N, 32A, 321
  const acMatch = rawTextJoined.match(/\b(787|788|789|320|319|32N|32A|321|B787|B788|B789|A320|A319|A321)\b/i);
  
  // Conteo de INF (Infantes) - Heurística: buscar la palabra INF o el código SSR INF
  const infantCount = (rawTextJoined.match(/\bINF\b/g) || []).length;

  const manifest: FlightManifest = {
    flightNumber: flightMatch ? flightMatch[0].toUpperCase().replace(/\s+/g, '') : 'Desconocido',
    date: dateMatch ? dateMatch[0] : '',
    aircraftType: acMatch ? acMatch[0].toUpperCase() : 'Desconocido',
    passengers: [],
    infantCount: infantCount
  };

  // Paso 3: Análisis multi-pasada (Línea por línea)
  const paxMap: Record<string, ParsedPassenger> = {};
  
  const getPax = (seat: string) => {
    const norm = normalizeSeat(seat);
    if (!paxMap[norm]) {
      paxMap[norm] = { seat: norm, firstName: '', lastName: '', codes: [], rawText: '' };
    }
    return paxMap[norm];
  };

  const allCodes = Object.values(FLIGHT_CODES).flatMap(cat => Object.keys(cat));
  const statusCodes = Object.keys(FLIGHT_CODES.STATUS);
  const seatRegex = /0*\d{1,3}[A-L]/g;

  fullTextLines.forEach(line => {
    const seatMatches = [...line.matchAll(seatRegex)];
    const seatsInLine = seatMatches.map(m => m[0]);
    
    // Buscar códigos en la línea
    const words = line.split(/\s+/).map(w => w.replace(/[^A-Z0-9]/g, ''));
    const codesInLine = allCodes.filter(c => words.includes(c));

    if (seatsInLine.length > 0) {
      // 1. Asignar códigos a TODOS los asientos encontrados en la línea 
      seatsInLine.forEach(seatRaw => {
        const pax = getPax(seatRaw);
        pax.rawText += line + ' ';
        codesInLine.forEach(code => {
          if (statusCodes.includes(code)) {
            pax.status = code;
          } else if (!pax.codes.includes(code)) {
            pax.codes.push(code);
          }
        });
      });

      // 2. Extraer nombres si la línea PARECE ser una fila de pasajero principal
      const startsWithSeat = new RegExp(`^0*\\d{1,3}[A-L]`).test(line);
      if (startsWithSeat && seatsInLine.length === 1) {
        const seatRaw = seatsInLine[0];
        const pax = getPax(seatRaw);
        
        const afterSeatParts = line.substring(line.indexOf(seatRaw) + seatRaw.length).split(/\s+/);
        
        // Filtramos códigos IATA de 3 letras conocidos y letras de cabina 'C'/'Y'
        const ignoreList = [
          'BOG', 'MAD', 'CLO', 'JFK', 'MIA', 'LHR', 'CTG', 'MED', 'BCN', 'LAX', 'PTY', 'SCL', 'LIM', 'GRU', 'EZE', 'MEX', 'CUN', 'SAL', 'GUA', 'UIO', 'GYE', 
          'C', 'Y', 'TO', 'FROM', 'VIA', 'DEST'
        ];
        
        const potentialNames = afterSeatParts.filter(w => 
          /^[A-ZÑÁÉÍÓÚ]{2,}$/.test(w) && 
          !allCodes.includes(w) && 
          !ignoreList.includes(w)
        );

        if (potentialNames.length >= 2 && !pax.lastName) {
          pax.firstName = potentialNames[0]; 
          pax.lastName = potentialNames.slice(1).join(' ');
        }
      }
    }
  });

  manifest.passengers = Object.values(paxMap).filter(p => p.firstName || p.lastName || p.codes.length > 0);
  return manifest;
};
