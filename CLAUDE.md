# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack Decidido

- **Frontend:** Vite + React 19 + TypeScript (SPA, procesamiento delegado al backend)
- **Estilos:** Tailwind CSS v4 + Lucide React
- **Estado global:** Zustand
- **Backend:** Python FastAPI + pdfplumber (`backend/main.py`)
- **PDF:** procesado en el backend con `pdfplumber` (detección visual de tabla, celdas vacías correctas)

## Comandos

```bash
# Frontend
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (http://localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # eslint
npm run preview      # vista previa del build

# Backend (Python)
cd backend
python -m venv .venv && source .venv/bin/activate  # una sola vez
pip install -r requirements.txt                     # una sola vez
uvicorn main:app --reload                           # http://localhost:8000
```

No hay tests configurados en este proyecto.

## Arquitectura (Clean Architecture)

```
src/
  domain/            # Modelos y diccionarios puros (sin dependencias externas)
    aircraftConfigs.ts   # Configuraciones de cabina por tipo de avión
    flightCodes.ts       # Diccionario de códigos SSR/operativos (WCHR, DIAM, etc.)
  infrastructure/
    pdfParser.ts         # Extracción de texto PDF y construcción del FlightManifest
  presentation/
    components/          # SeatMap, PassengerPanel, Dropzone
    store/useStore.ts    # Estado global (Zustand): manifest, selectedSeat, loading, error
  App.tsx            # Raíz: nav + layout condicional (Dropzone vs SeatMap+Panel)
```

## Dominio: Aircraft Configs

`AIRCRAFT_CONFIGS` es un `Record<string, AircraftConfig>` donde cada config tiene `elements: AircraftElement[]`. Los elementos se alternan entre `facility` (puertas, galleys, lavatories) y `cabin` (filas de asientos).

- `cabin` define: `class` (business/plus/economy), `layout` (array de letras de columna + `'aisle'`), `rows` (números de fila), `blockedSeats?` (ej. `['35D']`)
- `facility` con `components: []` renderiza solo indicadores de puertas laterales (se usa para salidas de emergencia sobre el ala OWE)

Aviones soportados: `B788_STD`, `B788_EXNAS`, `A320_STD`, `A319_STD`, `A319_N741AV`.

Para agregar un avión nuevo: añadir una entrada a `AIRCRAFT_CONFIGS` con su key y elementos.

## Infraestructura: PDF Parser

`parsePaxListPDF(file: File)` es ahora una función **async** que hace `POST /api/v1/manifest/parse` al backend Python y retorna el `FlightManifest` ya construido.

La URL del backend se configura con la variable de entorno `VITE_BACKEND_URL` (default: `http://localhost:8000`).

### Backend (`backend/main.py`)

- Usa `pdfplumber.open()` para extraer tablas por coordenadas visuales → celdas vacías son `None`, no corrupción por desplazamiento.
- Detecta el encabezado `Seat | First Name | Last Name | Cabin | To | Type | LFM | SSR | Meal | CEM` para indexar columnas correctamente.
- `codes`: agrega tokens de columnas SSR, Meal, CEM.
- `status`: tokens coincidentes con `{DIAM, GOLD, SILV, PLUS, STAFF}` (columna LFM).
- Asientos normalizados: `002A` → `2A`.
- Metadatos: regex sobre texto completo del PDF (`AV\d{2,4}`, patrones de fecha, tipo de avión).

## Presentación

**Semántica visual de asientos:**
- Diamond (`DIAM`/`D`): `bg-slate-900` texto blanco
- Gold (`GOLD`/`G`): `bg-amber-400` texto oscuro
- Ocupado (sin estatus): `bg-blue-100` texto azul
- Vacío: `bg-slate-200`
- Bloqueado: `bg-slate-800 opacity-20`

**Badges superpuestos en asientos** (esquina superior derecha): wheelchair (azul), mascotas (naranja), comidas especiales (verde), alertas médicas/jurídicas (rojo).

**Layout responsivo:**
- Mobile: mapa con scroll horizontal + PassengerPanel como bottom sheet (60vh) con backdrop
- Desktop (`lg:`): mapa scrolleable verticalmente + panel derecho sticky de 384px

**Privacidad de datos:** el cliente no retiene datos (Zustand en memoria pura, sin localStorage/IndexedDB/SW). El `reset()` limpia todo. **El PDF sí viaja al backend** para parsing y se descarta inmediatamente — sin almacenamiento ni retención de PII. El backend no loguea nombres, asientos ni datos personales. La comunicación se protege con API key + CORS + rate limiting. Nota: la API key está en el bundle JS del cliente (limitación de SPA); el proxy same-origin es la mejora pendiente para hardening completo.
