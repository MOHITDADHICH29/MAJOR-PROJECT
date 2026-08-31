#!/usr/bin/env python3
"""Build dataset manifest from Schizophrenia EEG and OpenNeuro ds004302."""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.manifest import build_manifest, write_manifest

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    project_root = Path(__file__).parent.parent
    metadata_dir = project_root / "data" / "metadata"
    manifest_path = metadata_dir / "dataset_manifest.csv"

    logger.info("=" * 60)
    logger.info("BUILDING DATASET MANIFEST (Schizophrenia + ds004302 + ds005073)")
    logger.info("=" * 60)

    entries = build_manifest(project_root)
    if not entries:
        logger.error("No subjects found. Ensure Schizophrenia/, ds004302/, or ds005073/ exist.")
        sys.exit(1)

    write_manifest(manifest_path, entries, project_root)

    logger.info("\n" + "=" * 60)
    logger.info("DATA PREPARATION COMPLETE")
    logger.info("=" * 60)
    logger.info("\nNext steps:")
    logger.info("1. Run: python scripts/download_ds004302.py")
    logger.info("2. Run: python scripts/download_ds005073.py")
    logger.info("3. Run: python scripts/create_splits.py")
    logger.info("4. Run: python scripts/train.py --modality eeg")
    logger.info("5. Run: python scripts/train.py --modality imaging")
    logger.info("6. Run: python scripts/train.py --modality multimodal --fusion early_fusion")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
