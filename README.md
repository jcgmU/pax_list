# PaxList — Avianca SeatMap Pro

Herramienta interna para visualizar el manifiesto de pasajeros de un vuelo Avianca sobre un mapa de cabina interactivo. Carga un PDF de lista de pasajeros y obtiene en segundos: asientos ocupados, estatus de viajero frecuente, requerimientos especiales (SSR) y estadísticas de vuelo.

Sin servidores de analítica. Sin almacenamiento de datos. Todo el procesamiento ocurre localmente (Zero Data Retention).

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vite + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + Lucide React |
| Estado global | Zustand |
| Backend | Python 3.11+ + FastAPI |
| Parsing PDF | pdfplumber |

## Setup

### Frontend

```bash
npm install
npm run dev        # http://localhost:5173
```

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

Copia `.env.example` → `.env` en la raiz para el frontend, y `backend/.env.example` → `backend/.env` para el backend.

## Variables de entorno

### Frontend (`.env`)

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:8000` | URL base del backend FastAPI |

### Backend (`backend/.env`)

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Origenes permitidos en CORS (separados por coma) |
| `MAX_FILE_BYTES` | `26214400` | Tamano maximo del PDF en bytes (25 MB) |
| `PARSE_TIMEOUT_SEC` | `20` | Timeout en segundos para el parsing del PDF |

## Arquitectura

```
src/
  domain/
    aircraftConfigs.ts    # Definicion de cabinas por tipo de avion (B788, A320, A319, etc.)
    aircraftMatch.ts      # Funcion pura: acType string -> clave de AIRCRAFT_CONFIGS
    flightCodes.ts        # Diccionario de codigos SSR/operativos (WCHR, DIAM, etc.)
    flightStats.ts        # Funciones puras de estadisticas (countEmptySeats, countSSR, countMeals)
  infrastructure/
    pdfParser.ts          # Cliente HTTP al backend: POST /api/v1/manifest/parse
  presentation/
    components/           # SeatMap, PassengerPanel, PassengerModal, Dropzone, StatsSidebar
    store/useStore.ts     # Estado global Zustand (manifest, selectedSeat, loading, error)
  App.tsx                 # Raiz: nav + layout condicional (Dropzone vs SeatMap + Panel)

backend/
  main.py                 # FastAPI app: endpoint /api/v1/manifest/parse con pdfplumber
  requirements.txt        # Dependencias Python
  tests/
    test_parser.py        # 18 tests: endpoint + funciones unitarias
```

## Testing

### Backend (pytest)

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
# 18 passed
```

### Frontend (vitest)

```bash
npm run test
# 19 passed (3 test files)
```

### Lint y build

```bash
npm run lint   # ESLint sin errores
npm run build  # tsc + vite build
```

## Diagnostico de errores

| `error_code` | Causa | Mensaje en UI | Que revisar en logs |
|--------------|-------|---------------|---------------------|
| `EMPTY_FILE` | El archivo PDF tiene 0 bytes | "El archivo esta vacio." | Verificar el archivo de origen; puede estar corrupto |
| `NOT_PDF` | Extension o tipo MIME no es `.pdf` | "El archivo no es un PDF valido." | Confirmar que el archivo tiene extension `.pdf` |
| `FILE_TOO_LARGE` | PDF supera `MAX_FILE_BYTES` (default 25 MB) | "El archivo excede el tamano maximo permitido." | Reducir tamano del PDF o aumentar `MAX_FILE_BYTES` en `.env` |
| `PARSE_TIMEOUT` | El parsing del PDF supero `PARSE_TIMEOUT_SEC` | "El servidor tardo demasiado. Intenta de nuevo." | Revisar CPU del servidor; aumentar `PARSE_TIMEOUT_SEC` si es PDF grande |
| `NO_TABLE_FOUND` | El PDF no contiene la tabla de pasajeros esperada | "No se encontro una lista de pasajeros valida en el PDF." | Verificar que el PDF es un manifiesto Avianca con encabezado Seat/First Name/Last Name |
| `MALFORMED_PDF` | El PDF esta danado o tiene formato inesperado | "El PDF esta danado o tiene un formato no soportado." | Ver traceback en logs del backend (sin datos de pasajeros) |
| `INTERNAL` | Error inesperado en el servidor | "Error interno del servidor." | Revisar logs completos del backend con traceback |

## Zero Data Retention

Ningun dato de pasajeros sale del dispositivo del usuario mas alla de la llamada al backend local. El backend no persiste nada en disco ni base de datos. El store de Zustand se limpia con `reset()` al cargar un nuevo archivo o cerrar la sesion. El backend solo recibe el PDF en memoria y retorna el manifiesto parseado en la misma request.

## Deploy

### Produccion

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | https://paxlist.vercel.app |
| Backend (Railway) | https://paxlist-backend-production.up.railway.app |

### Frontend (Vercel)

El proyecto se despliega automaticamente desde `main` via la integracion de Vercel.

```bash
npm run build
# Sirve dist/ con cualquier servidor estatico (nginx, Vercel, etc.)
```

Variables de entorno en Vercel:

| Variable | Valor |
|----------|-------|
| `VITE_BACKEND_URL` | `https://paxlist-backend-production.up.railway.app` |

### Backend (Railway)

El backend corre en Railway via nixpacks (Python 3.12). Configuracion en `backend/railway.toml`.

Variables de entorno en Railway:

| Variable | Valor |
|----------|-------|
| `ALLOWED_ORIGINS` | `https://paxlist.vercel.app` |
| `MAX_FILE_BYTES` | `26214400` |
| `PARSE_TIMEOUT_SEC` | `20` |

Para correr localmente:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Para produccion con concurrencia:

```bash
gunicorn main:app -k uvicorn.workers.UvicornWorker -w 2 --bind 0.0.0.0:8000
```
