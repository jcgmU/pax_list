# Implementación: Crews SeatMap Pro

## Objetivo
Construir una Single-Page Application (SPA) 100% Client-Side para la visualización interactiva de mapas de asientos a partir de archivos PDF de manifiestos de vuelo (PAXLIST). Optimizada para iPads/Móviles de tripulaciones de cabina, con "Zero Data Retention".

## Arquitectura (Clean Architecture)
- **Framework:** Vite + React 19 + TypeScript.
- **Estilos:** Tailwind CSS v4 + Lucide Icons.
- **Estado Global:** Zustand.
- **Procesamiento:** `pdfjs-dist` (100% navegador).
- **Estructura:**
  - `src/infrastructure/`: Extracción de PDF (`pdfParser.ts`).
  - `src/domain/`: Diccionarios de códigos y modelos de avión.
  - `src/presentation/`: Componentes React.

## Capa de Dominio (Configuraciones)

### 1. Modelos de Avión (`src/domain/aircraftConfigs.ts`)
Renderización de la cabina incluyendo `facility` (puertas, baños, galleys) y `cabin` (asientos).
- **Boeing 787:** `B788_STD` (Estándar) y `B788_EXNAS`.
- **Airbus A320 Family:** `A320_STD`, `A319_STD`, `A319_N741AV`.
- *Nota UI:* Si un `facility` tiene `components: []` (ej. salidas sobre las alas OWE L/R), solo se muestran las puertas laterales.

### 2. Diccionario de Códigos (`src/domain/flightCodes.ts`)
Búsqueda por proximidad al asiento detectado en el PDF:
- **Médicos/Movilidad:** BLND, DEAF, DPNA, PRM, WCHC, WCMP, WCOB, WCHR, WCHS, POC, CPAP.
- **Jurídicos:** PICA, DEPA, DEPU, INAD.
- **Equipaje/Asistencia:** EXST, CBBG, ABP.
- **Animales:** SVAN, ESAN, PETC.
- **Comidas Especiales:** BBML, CHML, VGML, GFML, MEML, FSML, PSML.
- **Baterías:** WCLB, WCBW.
- **Lealtad/Estatus:** DIAM (D), GOLD (G), SILV (SILVER), PLUS, BDAY, CLIENTE TOP, STAFF, INF, CHD.

## Lógica del Parser (Infraestructura)
1. Extraer texto plano (sin coordenadas X/Y).
2. Identificar asientos (Regex: `001A` -> `1A`).
3. Buscar códigos adyacentes en una ventana de contexto.
4. Extraer nombre (texto en mayúsculas adyacente).

## UI/UX y Semántica Visual (Presentación)
- **Dropzone:** Inicia ocultando la interfaz hasta procesar el PDF (fade-in del mapa).
- **Semántica de Asientos (Fondo):**
  - Diamond: Pizarra/Gris Oscuro (`bg-slate-900`).
  - Gold: Dorado (`bg-amber-400`).
  - Ocupado: Azul Claro (`bg-blue-100`).
  - Vacío: Gris Claro (`bg-gray-200`).
- **Alertas Operativas (Badges Lucide superpuestos):** Silla de ruedas (azul), Mascotas (naranja), Comidas (verde), Alertas médicas/jurídicas (rojo).
- **Responsividad y Drawer:**
  - *Mobile:* Columna, scroll horizontal, Bottom Sheet (60vh).
  - *Tablet/iPad:* Fila, panel derecho `sticky`.
  - *Interacción:* Al hacer click en un asiento, se abre el panel con detalles.

## Pasos de Ejecución Inmediatos
1. Inicializar Vite con React y TypeScript.
2. Instalar dependencias (`tailwindcss`, `lucide-react`, `zustand`, `pdfjs-dist`).
3. Crear los archivos de dominio (`aircraftConfigs.ts` y `flightCodes.ts`).
4. Implementar el parser (`pdfParser.ts`).
5. Construir los componentes de la interfaz.