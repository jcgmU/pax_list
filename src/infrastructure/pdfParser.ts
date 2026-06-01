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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export const parsePaxListPDF = async (file: File): Promise<FlightManifest> => {
  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/manifest/parse`, {
      method: "POST",
      headers: {
        'X-API-Key': import.meta.env.VITE_API_KEY ?? '',
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("PARSE_TIMEOUT: El servidor tardó demasiado en responder.", { cause: err });
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED: Acceso no autorizado al servidor.');
    if (response.status === 429) throw new Error('RATE_LIMITED: Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.');
    let body: { error_code?: string; detail?: string } | null = null;
    try {
      body = await response.json();
    } catch {
      // body is not JSON, fall through to generic error
    }
    if (body?.error_code) throw new Error(body.error_code + ": " + (body.detail ?? ""));
    if (body?.detail) throw new Error(body.detail);
    throw new Error("Error procesando el manifiesto en el servidor.");
  }

  return response.json() as Promise<FlightManifest>;
};
