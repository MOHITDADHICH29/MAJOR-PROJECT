#!/usr/bin/env python3
"""Download real NIfTI files for OpenNeuro ds005073 from OpenNeuro S3."""

import argparse
import logging
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.manifest import build_ds005073_entries

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

OPENNEURO_BASE = "https://s3.amazonaws.com/openneuro.org/ds005073"


def is_valid_nifti(path: Path) -> bool:
    if not path.exists() or path.stat().st_size < 100_000:
        return False
    try:
        import nibabel as nib

        img = nib.load(str(path))
        _ = img.get_fdata(dtype="float32")
        return True
    except Exception:
        return False


def download_file(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)

    if is_valid_nifti(dest):
        logger.info("  ✓ Skip (already valid): %s", dest.name)
        return True

    if dest.exists():
        logger.info("  Replacing placeholder/invalid file: %s", dest.name)
        try:
            dest.unlink()
        except Exception:
            pass

    logger.info("  Downloading: %s", dest.name)
    tmp_path = dest.parent / f".tmp_{dest.name}"
    try:
        urllib.request.urlretrieve(url, tmp_path)
        if not is_valid_nifti(tmp_path):
            raise RuntimeError(f"Downloaded file failed validation: {dest.name}")
        tmp_path.replace(dest)
        logger.info("  ✓ Successfully downloaded and validated: %s (size: %d bytes)", dest.name, dest.stat().st_size)
        return True
    except Exception as e:
        logger.error("  ✗ Failed to download %s: %s", dest.name, e)
        return False
    finally:
        if tmp_path.exists():
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass


def download_ds005073(project_root: Path, max_subjects: int = None, download_fmri: bool = False) -> int:
    """Download T1w MRI (and optionally fMRI) files for ds005073."""
    entries = build_ds005073_entries(project_root)
    downloaded = 0

    if max_subjects is not None:
        entries = entries[:max_subjects]

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
            if download_file(url, dest):
                downloaded += 1

    return downloaded


def main() -> None:
    parser = argparse.ArgumentParser(description="Download real NIfTI files for ds005073")
    parser.add_argument("--max-subjects", type=int, default=None, help="Max number of subjects to download")
    parser.add_argument("--fmri", action="store_true", help="Also download functional fMRI scans")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent
    logger.info("Downloading ds005073 imaging data from OpenNeuro S3...")
    count = download_ds005073(project_root, max_subjects=args.max_subjects, download_fmri=args.fmri)
    logger.info("Download complete (%d files processed).", count)


if __name__ == "__main__":
    main()
