# Spec: Rediseño Avianca SeatMap Pro

**Fecha:** 2026-05-14
**Estado:** Aprobado
**Autor:** Gemini CLI

## 1. Objetivo
Transformar la interfaz actual para alinearla con la identidad corporativa de Avianca, mejorar la usabilidad mediante un panel de estadísticas global y un modal de detalles de pasajero, y corregir errores técnicos en el parseo de datos y el layout del Boeing 787.

## 2. Identidad Visual (Branding)
- **Rojo Avianca:** `#E20613` (Primario: Botones, cabeceras, estados activos).
- **Gris Corporativo:** `#555555` (Secundario: Textos, bordes, elementos desactivados).
- **Blanco:** `#FFFFFF` (Fondo principal, tarjetas).
- **Tipografía:** Mantener sans-serif limpia, priorizando legibilidad.

## 3. Cambios en la Interfaz (UI/UX)

### 3.1 Barra Lateral de Estadísticas (Sidebar)
- **Ubicación:** Lado derecho (Desktop).
- **Contenido:**
  - **Buscador:** Input superior para buscar por asiento (ej. 1A) o nombre. Al encontrar coincidencia, resalta la silla en el mapa (pero no abre el modal automáticamente, según preferencia del usuario).
  - **Contadores Globales:**
    - Total de sillas vacías.
    - Desglose de SSRs (ej. WCHR: 4, PETC: 2).
    - Total de comidas especiales solicitadas (SPML).

### 3.2 Modal de Detalles de Pasajero
- **Activación:** Clic en una silla ocupada.
- **Contenido:**
  - Nombre completo (Apellido, Nombre).
  - Status LifeMiles (Diamond, Gold, etc.) con colores corporativos.
  - Lista completa de códigos SSR detectados con sus descripciones.
  - Botón de cierre (X).

### 3.3 Mapa de Asientos
- Resaltar sillas mediante el Buscador (ej. borde rojo grueso o animación).

## 4. Correcciones Técnicas

### 4.1 Parser de PDF (`pdfParser.ts`)
- **Vuelo:** Modificar regex `/AV\s?\d{2,4}\b/i` para asegurar que no capture dígitos adyacentes de la fecha si el espacio falla. Refinar captura de `flightNumber`.
- **Nombres:** Excluir explícitamente códigos IATA de destino (LHR, MAD, BOG, etc.) de la lógica de detección de nombres para evitar que el destino se tome como apellido.
- **SSR Completo:** Asegurar que se concatenen/muestren todos los códigos detectados en las múltiples pasadas por fila.

### 4.2 Layout del Aircraft (`aircraftConfigs.ts`)
- **B787-8:** 
  - Eliminar baños (`bath`) en el elemento `facility` de las puertas L2/R2 (Mid Galley).
  - Confirmar posición de puertas y Galleys.

## 5. Arquitectura y Estado
- **Store (`useStore.ts`):** 
  - Añadir estado para `searchTerm`.
  - Añadir getters para estadísticas globales (vacíos, SSR counts).
- **Componentes:**
  - `PassengerModal.tsx`: Nuevo componente para el modal.
  - `StatsSidebar.tsx`: Renombrar/Refactorizar `PassengerPanel.tsx`.
  - `SearchBar.tsx`: Nuevo subcomponente para el sidebar.

## 6. Criterios de Aceptación
1. El color predominante es el Rojo Avianca.
2. La barra lateral muestra estadísticas correctas y no los detalles de un pasajero.
3. Al hacer clic en una silla se abre un modal con la info completa.
4. El número de vuelo se extrae correctamente sin números extra.
5. El destino (ej. LHR) no aparece como nombre de pasajero.
6. El Mid Galley del 787 no muestra baños en la primera fila.
