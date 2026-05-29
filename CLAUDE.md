# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack Decidido

- **Framework:** Vite + React 19 + TypeScript (SPA 100% client-side, sin backend)
- **Estilos:** Tailwind CSS v4 + Lucide React
- **Estado global:** Zustand
- **PDF:** pdfjs-dist (procesamiento en el navegador)
- **No hay servidor, API, ni base de datos.** Todo procesamiento ocurre en memoria del cliente.

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo
npm run build        # tsc -b && vite build
npm run lint         # eslint
npm run preview      # vista previa del build
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

`parsePaxListPDF(file)` devuelve un `FlightManifest`. El algoritmo tiene tres pasos:

1. **Agrupación por coordenada Y** (tolerancia 4px): reconstruye líneas de texto reales desde los items posicionales de PDF.js
2. **Metadatos del vuelo**: regex sobre texto sin espacios (`AV\d{2,4}`, fecha `202x`, tipo de avión)
3. **Análisis multi-pasada**: para cada línea, extrae asientos (regex `0*\d{1,3}[A-L]`), asigna todos los códigos encontrados a todos los asientos de esa línea (esto maneja las tablas resumen tipo `WCHR 002A 015D`), y extrae nombres solo cuando la línea empieza con un asiento y tiene exactamente uno

Los asientos se normalizan eliminando ceros a la izquierda (`002A` → `2A`).

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

**Zero Data Retention:** ningún dato de pasajeros sale del navegador. El `reset()` del store limpia todo.
