import asyncio
import concurrent.futures
import io
import logging
import os
import re
import traceback
from typing import Optional

import pdfplumber
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Config / Constants
# ---------------------------------------------------------------------------

MAX_FILE_BYTES = int(os.getenv("MAX_FILE_BYTES", str(25 * 1024 * 1024)))
PARSE_TIMEOUT_SEC = int(os.getenv("PARSE_TIMEOUT_SEC", "20"))
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173"
).split(",")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Error codes
# ---------------------------------------------------------------------------

class ErrorCode:
    EMPTY_FILE = "EMPTY_FILE"
    NOT_PDF = "NOT_PDF"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    PARSE_TIMEOUT = "PARSE_TIMEOUT"
    NO_TABLE_FOUND = "NO_TABLE_FOUND"
    MALFORMED_PDF = "MALFORMED_PDF"
    INTERNAL = "INTERNAL"


def http_error(status: int, detail: str, code: str) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"detail": detail, "error_code": code},
    )


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="PaxList Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ParsedPassenger(BaseModel):
    seat: str
    firstName: str
    lastName: str
    status: Optional[str] = None
    codes: list[str] = []
    rawText: str


class FlightManifest(BaseModel):
    flightNumber: str
    date: str
    aircraftType: str
    passengers: list[ParsedPassenger] = Field(default=[], max_length=2000)
    infantCount: int


# ---------------------------------------------------------------------------
# Domain constants
# ---------------------------------------------------------------------------

HEADER_SEAT_VARIANTS = {"seat"}
HEADER_FIRST_VARIANTS = {"first", "first name"}
HEADER_LAST_VARIANTS = {"last", "last name"}

STATUS_CODES = {"DIAM", "GOLD", "SILV", "SILVER", "PLUS", "STAFF"}

AC_PATTERN = re.compile(
    r"\b(B?787|B?788|B?789|A?320|A?319|A?321|32N|32A|319|320|321|787|788|789)\b",
    re.IGNORECASE,
)
FLIGHT_PATTERN = re.compile(r"\bAV\s?\d{2,4}\b", re.IGNORECASE)
DATE_PATTERN = re.compile(
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
    r"|\b\d{2,4}[/-]\d{1,2}[/-]\d{1,2}\b"
    r"|\b\d{1,2}\s+\w{3}\s+\d{4}\b"
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_cell(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def safe_cell(row: list, idx: int) -> str:
    """Return clean_cell(row[idx]) if idx is within bounds, else empty string."""
    if idx < len(row):
        return clean_cell(row[idx])
    return ""


def normalize_seat(raw: str) -> str:
    raw = raw.strip()
    match = re.match(r"^0*(\d+)([A-L])$", raw, re.IGNORECASE)
    if match:
        return f"{match.group(1)}{match.group(2).upper()}"
    return raw


def detect_column_indices(header_row: list) -> dict[str, int] | None:
    normalized = [clean_cell(c).lower() for c in header_row]

    indices: dict[str, int] = {}
    for i, cell in enumerate(normalized):
        if cell in HEADER_SEAT_VARIANTS:
            indices["seat"] = i
        elif cell in HEADER_FIRST_VARIANTS or cell == "first":
            indices["firstName"] = i
        elif cell in HEADER_LAST_VARIANTS or cell == "last":
            indices["lastName"] = i
        elif cell == "cabin":
            indices["cabin"] = i
        elif cell == "to":
            indices["to"] = i
        elif cell == "type":
            indices["type"] = i
        elif cell == "lfm":
            indices["lfm"] = i
        elif cell == "ssr":
            indices["ssr"] = i
        elif cell == "meal":
            indices["meal"] = i
        elif cell == "cem":
            indices["cem"] = i

    if "seat" not in indices or ("firstName" not in indices and "lastName" not in indices):
        return None

    return indices


def extract_codes_from_row(row: list, col_map: dict[str, int]) -> tuple[Optional[str], list[str]]:
    status: Optional[str] = None
    codes: list[str] = []

    code_columns = ["lfm", "ssr", "meal", "cem"]
    for col_key in code_columns:
        if col_key not in col_map:
            continue
        value = safe_cell(row, col_map[col_key]).upper()
        if not value:
            continue
        for token in value.split():
            token = token.strip()
            if not token:
                continue
            if token in STATUS_CODES:
                status = token
            elif token not in codes:
                codes.append(token)

    return status, codes


def extract_metadata(full_text: str) -> tuple[str, str, str]:
    flight_match = FLIGHT_PATTERN.search(full_text)
    flight_number = flight_match.group(0).upper().replace(" ", "") if flight_match else "Desconocido"

    date_match = DATE_PATTERN.search(full_text)
    date = date_match.group(0) if date_match else ""

    if not date:
        seq_match = re.search(r"202[0-9]\d{4}", full_text.replace(" ", ""))
        date = seq_match.group(0) if seq_match else ""

    ac_match = AC_PATTERN.search(full_text)
    aircraft_type = ac_match.group(0).upper() if ac_match else "Desconocido"

    return flight_number, date, aircraft_type


# ---------------------------------------------------------------------------
# Core Parser
# ---------------------------------------------------------------------------

def parse_manifest(file_bytes: bytes) -> FlightManifest:
    passengers: list[ParsedPassenger] = []
    full_text_parts: list[str] = []
    infant_count = 0

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            full_text_parts.append(page_text)

            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue

                col_map = None
                data_start = 0
                for row_idx, row in enumerate(table):
                    col_map = detect_column_indices(row)
                    if col_map is not None:
                        data_start = row_idx + 1
                        break

                if col_map is None:
                    continue

                for row in table[data_start:]:
                    if row is None:
                        continue

                    raw_seat = safe_cell(row, col_map["seat"]) if "seat" in col_map else ""
                    if not raw_seat or not re.match(r"0*\d+[A-L]", raw_seat, re.IGNORECASE):
                        continue

                    seat = normalize_seat(raw_seat)
                    first_name = safe_cell(row, col_map["firstName"]) if "firstName" in col_map else ""
                    last_name = safe_cell(row, col_map["lastName"]) if "lastName" in col_map else ""

                    if "type" in col_map:
                        pax_type = safe_cell(row, col_map["type"]).upper()
                        if pax_type == "INF":
                            infant_count += 1

                    status, codes = extract_codes_from_row(row, col_map)

                    raw_text = " ".join(clean_cell(c) for c in row if c is not None)

                    passengers.append(ParsedPassenger(
                        seat=seat,
                        firstName=first_name,
                        lastName=last_name,
                        status=status,
                        codes=codes,
                        rawText=raw_text,
                    ))

    full_text = "\n".join(full_text_parts)
    flight_number, date, aircraft_type = extract_metadata(full_text)

    if infant_count == 0:
        infant_count = len(re.findall(r"\bINF\b", full_text))

    return FlightManifest(
        flightNumber=flight_number,
        date=date,
        aircraftType=aircraft_type,
        passengers=passengers,
        infantCount=infant_count,
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/v1/manifest/parse", response_model=FlightManifest)
async def parse_manifest_endpoint(file: UploadFile = File(...)):
    # Validate extension
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise http_error(400, "El archivo debe ser un PDF.", ErrorCode.NOT_PDF)

    content = await file.read()

    # Validate content
    if len(content) == 0:
        raise http_error(400, "El archivo está vacío.", ErrorCode.EMPTY_FILE)

    if len(content) > MAX_FILE_BYTES:
        logger.warning(
            "file_too_large filename=%s size=%d limit=%d",
            file.filename, len(content), MAX_FILE_BYTES,
        )
        raise http_error(413, "El archivo supera el tamaño máximo permitido.", ErrorCode.FILE_TOO_LARGE)

    # Parse with timeout
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as pool:
        try:
            manifest = await asyncio.wait_for(
                loop.run_in_executor(pool, parse_manifest, content),
                timeout=PARSE_TIMEOUT_SEC,
            )
        except asyncio.TimeoutError:
            logger.error(
                "parse_timeout filename=%s size=%d", file.filename, len(content)
            )
            raise http_error(504, "El procesamiento tardó demasiado.", ErrorCode.PARSE_TIMEOUT)
        except Exception as exc:
            logger.error(
                "parse_error filename=%s size=%d error=%s\n%s",
                file.filename, len(content), type(exc).__name__, traceback.format_exc(),
            )
            raise http_error(422, "No se pudo procesar el PDF.", ErrorCode.MALFORMED_PDF)

    if not manifest.passengers:
        logger.warning("no_table_found filename=%s size=%d", file.filename, len(content))
        raise http_error(422, "No se encontró tabla de pasajeros en el PDF.", ErrorCode.NO_TABLE_FOUND)

    logger.info(
        "parse_ok filename=%s size=%d passengers=%d infants=%d aircraft=%s",
        file.filename, len(content), len(manifest.passengers), manifest.infantCount, manifest.aircraftType,
    )

    return manifest


@app.get("/health")
def health():
    return {"status": "ok"}
