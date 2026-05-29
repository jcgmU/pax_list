# Plan de Correcciones y Mejoras: Crews SeatMap Pro

## 1. Identidad Visual (Avianca Corporate Colors)
- Actualizar `Dropzone.tsx`, `App.tsx` y otros componentes para utilizar la paleta corporativa de Avianca (Rojos `bg-red-600`, textos oscuros y blancos) en lugar de los tonos azules genéricos.

## 2. Mejoras en el Parser de PDF (`src/infrastructure/pdfParser.ts`)
- **Corrección Número de Vuelo:** El regex actual fusionaba el vuelo con el año (ej. `AV1822026`). Se ajustará para buscar el número de vuelo en el texto con espacios (`rawTextJoined`) limitando con `\b`.
- **Filtro de Nombres (Destinos):** Para evitar que el código IATA de destino (ej. `LHR`, `BOG`, `MAD`) se extraiga como nombre, se implementará un filtro estricto que descarte coincidencias exactas con códigos de aeropuertos comunes y letras de cabina (`C`, `Y`).
- **Múltiples Códigos:** Se revisará la lógica de `codesInLine` para garantizar que *todas* las particularidades (SSRs, Comidas, Alertas) encontradas en el documento asociadas a un pasajero se guarden en su array de `codes`.

## 3. Corrección Configuración de Flota (`src/domain/aircraftConfigs.ts`)
- **Boeing 787:** Se corregirá el layout. El `Mid Galley` (puertas L2/R2) quedará exclusivamente como Galley sin baños. Los baños se moverán a la sección delantera (puertas L1/R1), dejando dos baños allí (Lav L y Lav R).

## 4. Rediseño de Interfaz: Modal y Summary
- **Passenger Modal:** Se eliminará la barra lateral actual de detalles del pasajero. En su lugar, al hacer clic en un asiento, la información del pasajero (Estatus, SSRs, Comidas) se mostrará en una ventana Modal/Dialog flotante, manteniendo el mapa limpio.
- **Flight Summary Sidebar:** Se creará una nueva barra lateral estática (o colapsable) enfocada en lo operativo. Mostrará:
  - Contador total de sillas vacías.
  - Cantidad total de servicios especiales (SSRs).
  - Cantidad total de comidas solicitadas.
  - Resumen rápido del vuelo.