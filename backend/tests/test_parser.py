"""Tests for PaxList backend parser."""
import io
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import (
    ErrorCode,
    MAX_FILE_BYTES,
    detect_column_indices,
    extract_codes_from_row,
    http_error,
    normalize_seat,
    safe_cell,
    app,
)

client = TestClient(app, raise_server_exceptions=False)

# ---------------------------------------------------------------------------
# Minimal valid PDF bytes (PDF spec: header + %%EOF)
# ---------------------------------------------------------------------------
MINIMAL_PDF = b"%PDF-1.4\n%%EOF"


def _make_mock_pdf(rows: list[list]):
    """Build a pdfplumber mock that returns one page with one table."""
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "AV123 01/01/2024 B788"
    mock_page.extract_tables.return_value = [rows]

    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page]
    mock_pdf.__enter__ = lambda s: s
    mock_pdf.__exit__ = MagicMock(return_value=False)
    return mock_pdf


VALID_TABLE = [
    ["Seat", "First Name", "Last Name", "Cabin", "To", "Type", "LFM", "SSR", "Meal", "CEM"],
    ["001A", "JUAN", "PEREZ", "Y", "BOG", "ADT", "GOLD", "", "", ""],
    ["002B", "MARIA", "GARCIA", "J", "MIA", "ADT", "", "WCHR", "", ""],
]


# ---------------------------------------------------------------------------
# Endpoint tests
# ---------------------------------------------------------------------------

def _upload(filename: str, content: bytes, content_type: str = "application/pdf"):
    return client.post(
        "/api/v1/manifest/parse",
        files={"file": (filename, io.BytesIO(content), content_type)},
    )


def test_happy_path():
    mock_pdf = _make_mock_pdf(VALID_TABLE)
    with patch("pdfplumber.open", return_value=mock_pdf):
        resp = _upload("manifest.pdf", MINIMAL_PDF)
    assert resp.status_code == 200
    data = resp.json()
    assert "passengers" in data
    assert len(data["passengers"]) == 2
    assert data["passengers"][0]["seat"] == "1A"


def test_empty_file():
    resp = _upload("manifest.pdf", b"")
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == ErrorCode.EMPTY_FILE


def test_not_pdf():
    resp = _upload("manifest.txt", b"some text content", content_type="text/plain")
    assert resp.status_code == 400
    assert resp.json()["detail"]["error_code"] == ErrorCode.NOT_PDF


def test_file_too_large():
    big = b"x" * (MAX_FILE_BYTES + 1)
    resp = _upload("manifest.pdf", big)
    assert resp.status_code == 413
    assert resp.json()["detail"]["error_code"] == ErrorCode.FILE_TOO_LARGE


def test_malformed_pdf():
    with patch("pdfplumber.open", side_effect=Exception("corrupted")):
        resp = _upload("manifest.pdf", MINIMAL_PDF)
    assert resp.status_code == 422
    assert resp.json()["detail"]["error_code"] == ErrorCode.MALFORMED_PDF


def test_no_table_found():
    # Page returns no tables at all
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "AV123 01/01/2024 B788"
    mock_page.extract_tables.return_value = []
    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page]
    mock_pdf.__enter__ = lambda s: s
    mock_pdf.__exit__ = MagicMock(return_value=False)
    with patch("pdfplumber.open", return_value=mock_pdf):
        resp = _upload("manifest.pdf", MINIMAL_PDF)
    assert resp.status_code == 422
    assert resp.json()["detail"]["error_code"] == ErrorCode.NO_TABLE_FOUND


def test_short_row():
    """A data row shorter than the header must not crash the parser."""
    table = [
        ["Seat", "First Name", "Last Name", "Cabin", "To", "Type", "LFM", "SSR", "Meal", "CEM"],
        ["003C", "LUIS"],  # very short row
        ["004D", "ANA", "LOPEZ", "Y", "BOG", "ADT", "", "", "", ""],
    ]
    mock_pdf = _make_mock_pdf(table)
    with patch("pdfplumber.open", return_value=mock_pdf):
        resp = _upload("manifest.pdf", MINIMAL_PDF)
    assert resp.status_code == 200
    data = resp.json()
    # At least the well-formed row must appear
    assert any(p["seat"] == "4D" for p in data["passengers"])


# ---------------------------------------------------------------------------
# Unit tests for helpers
# ---------------------------------------------------------------------------

def test_normalize_seat_leading_zeros():
    assert normalize_seat("002A") == "2A"
    assert normalize_seat("001L") == "1L"


def test_normalize_seat_no_change():
    assert normalize_seat("15B") == "15B"


def test_normalize_seat_uppercase():
    assert normalize_seat("003c") == "3C"


def test_detect_column_indices_valid():
    header = ["Seat", "First Name", "Last Name", "Cabin", "To", "Type", "LFM", "SSR", "Meal", "CEM"]
    result = detect_column_indices(header)
    assert result is not None
    assert result["seat"] == 0
    assert result["firstName"] == 1
    assert result["lastName"] == 2
    assert result["lfm"] == 6


def test_detect_column_indices_invalid():
    header = ["Name", "Age", "City"]
    result = detect_column_indices(header)
    assert result is None


def test_extract_codes_diam_in_lfm():
    col_map = {"seat": 0, "firstName": 1, "lastName": 2, "lfm": 3}
    row = ["1A", "JUAN", "PEREZ", "DIAM"]
    status, codes = extract_codes_from_row(row, col_map)
    assert status == "DIAM"
    assert codes == []


def test_extract_codes_ssr_tokens():
    col_map = {"seat": 0, "firstName": 1, "lastName": 2, "lfm": 3, "ssr": 4}
    row = ["1A", "JUAN", "PEREZ", "", "WCHR PETC"]
    status, codes = extract_codes_from_row(row, col_map)
    assert status is None
    assert "WCHR" in codes
    assert "PETC" in codes


def test_safe_cell_within_bounds():
    row = ["a", "b", "c"]
    assert safe_cell(row, 1) == "b"


def test_safe_cell_out_of_bounds():
    row = ["a", "b"]
    assert safe_cell(row, 10) == ""


def test_safe_cell_none_value():
    row = [None, "b"]
    assert safe_cell(row, 0) == ""


def test_http_error_structure():
    exc = http_error(400, "some detail", ErrorCode.NOT_PDF)
    assert exc.status_code == 400
    assert exc.detail["error_code"] == ErrorCode.NOT_PDF
    assert exc.detail["detail"] == "some detail"
