#!/usr/bin/env python3
"""Download real NIfTI files for ds004302 from OpenNeuro S3."""

import logging
import sys
import tempfile
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.manifest import build_ds004302_entries

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OPENNEURO_BASE = "https://s3.amazonaws.com/openneuro.org/ds004302"


def is_valid_nifti(path: Path) -> bool:
    if not path.exists() or path.stat().st_size < 10_000:
        return False
    try:
        import nibabel as nib

        img = nib.load(str(path))
        _ = img.get_fdata(dtype="float32")
        return True
    except Exception:
        return False


def download_file(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)

    if is_valid_nifti(dest):
        logger.info("  skip (valid): %s", dest.name)
        return

    if dest.exists():
        logger.warning("  replacing invalid file: %s", dest.name)
        dest.unlink()

    logger.info("  downloading: %s", dest.name)
    tmp_path = dest.with_name(dest.name + ".part")
    try:
        urllib.request.urlretrieve(url, tmp_path)
        if not is_valid_nifti(tmp_path):
            raise RuntimeError(f"Downloaded file failed validation: {dest.name}")
        tmp_path.replace(dest)
    finally:
        if tmp_path.exists():
            tmp_path.unlink(missing_ok=True)


def download_ds004302(project_root: Path, download_fmri: bool = False) -> int:
    """Download T1w (and optionally fMRI) files listed in the manifest."""
    entries = build_ds004302_entries(project_root)
    downloaded = 0

    for entry in entries:
        subject_id = entry["subject_id"]

        for key, s3_suffix in (
            ("mri_path", "anat"),
            ("fmri_path", "func"),
        ):
            rel_path = entry.get(key) or ""
            if not rel_path:
                continue
            if key == "fmri_path" and not download_fmri:
                continue

            dest = project_root / rel_path.replace("/", "\\")
            filename = dest.name
            folder = s3_suffix
            url = f"{OPENNEURO_BASE}/{subject_id}/{folder}/{filename}"
            download_file(url, dest)
            downloaded += 1

    return downloaded


def main() -> None:
    project_root = Path(__file__).parent.parent
    logger.info("Downloading ds004302 imaging data from OpenNeuro...")
    count = download_ds004302(project_root, download_fmri=False)
    logger.info("Download complete (%d files processed).", count)
    logger.info("Run: python scripts/train.py --modality imaging")


if __name__ == "__main__":
    main()
