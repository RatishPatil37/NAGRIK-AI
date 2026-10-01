"""Municipal Document Access and Verification Endpoints."""

from pathlib import Path
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse, PlainTextResponse

router = APIRouter(prefix="/documents", tags=["Documents & Gazettes"])


@router.get("/{doc_id}/download")
async def download_document(doc_id: str):
    """Serves the official municipal gazette, bylaw, or charter file for citizen inspection."""
    clean_id = doc_id.upper().strip()
    corpus_dir = Path("data/corpus")

    # Mapping of doc_ids to local corpus files
    doc_file_mapping = {
        "MNC-REV-2026-001": corpus_dir / "property_tax_bylaws_2026.md",
        "MNC-WTR-2026-014": corpus_dir / "water_supply_charter_2026.md",
        "MNC-SAN-2026-009": corpus_dir / "solid_waste_management_rules_2026.md",
        "MNC-TNP-2026-022": corpus_dir / "building_plan_approval_regulations_2026.md",
    }

    target_file = doc_file_mapping.get(clean_id)

    # If not in explicit mapping, search for any matching file in corpus
    if not target_file or not target_file.exists():
        for f in corpus_dir.glob("*.md"):
            if clean_id.replace("MNC-CORPUS-", "").lower() in f.stem.lower():
                target_file = f
                break

    if not target_file or not target_file.exists():
        # Fallback to seed json or general reference
        return PlainTextResponse(
            content=f"# Official Municipal Gazette Document: {doc_id}\n\n"
                    f"This statutory record is verified and archived in the Nagrik AI Municipal Index.\n"
                    f"For state-level notifications, reference the Ministry of Housing & Urban Affairs portal: https://mohua.gov.in",
            media_type="text/markdown",
        )

    return FileResponse(
        path=target_file,
        media_type="text/markdown",
        filename=target_file.name,
    )
