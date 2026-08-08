"""Validate dataset."""

import os
import logging
from pathlib import Path
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def validate_dataset():
    """Validate dataset structure and files."""
    logger.info("=" * 60)
    logger.info("Dataset Validation")
    logger.info("=" * 60)

    data_dir = Path("data")

    if not data_dir.exists():
        logger.warning("Data directory not found. Creating...")
        data_dir.mkdir(parents=True, exist_ok=True)

    raw_dir = data_dir / "raw"
    processed_dir = data_dir / "processed"
    metadata_dir = data_dir / "metadata"

    # Check directories
    logger.info("\n[1] Directory Structure")

    for directory in [raw_dir, processed_dir, metadata_dir]:
        if directory.exists():
            logger.info(f"✓ {directory}")
        else:
            logger.warning(f"✗ {directory} (creating...)")
            directory.mkdir(parents=True, exist_ok=True)

    # Check metadata
    logger.info("\n[2] Metadata Files")

    manifest_path = metadata_dir / "dataset_manifest.csv"

    if manifest_path.exists():
        logger.info(f"✓ {manifest_path}")
        try:
            df = pd.read_csv(manifest_path)
            logger.info(f"  Records: {len(df)}")
        except Exception as e:
            logger.error(f"  Error reading manifest: {e}")
    else:
        logger.warning(f"✗ {manifest_path} (NOT FOUND)")

    # Check EEG data
    logger.info("\n[3] EEG Data")

    eeg_dir = raw_dir / "eeg"
    eeg_dir.mkdir(parents=True, exist_ok=True)

    eeg_files = list(eeg_dir.glob("*.*"))
    if eeg_files:
        logger.info(f"✓ Found {len(eeg_files)} EEG files")
    else:
        logger.warning("✗ No EEG files found")

    # Check MRI data
    logger.info("\n[4] MRI Data")

    mri_dir = raw_dir / "mri"
    mri_dir.mkdir(parents=True, exist_ok=True)

    mri_files = list(mri_dir.glob("*.*"))
    if mri_files:
        logger.info(f"✓ Found {len(mri_files)} MRI files")
    else:
        logger.warning("✗ No MRI files found")

    # Check fMRI data
    logger.info("\n[5] fMRI Data")

    fmri_dir = raw_dir / "fmri"
    fmri_dir.mkdir(parents=True, exist_ok=True)

    fmri_files = list(fmri_dir.glob("*.*"))
    if fmri_files:
        logger.info(f"✓ Found {len(fmri_files)} fMRI files")
    else:
        logger.warning("✗ No fMRI files found")

    # Check CT data
    logger.info("\n[6] CT Data")

    ct_dir = raw_dir / "ct"
    ct_dir.mkdir(parents=True, exist_ok=True)

    ct_files = list(ct_dir.glob("*.*"))
    if ct_files:
        logger.info(f"✓ Found {len(ct_files)} CT files")
    else:
        logger.warning("✗ No CT files found")

    # Summary
    logger.info("\n" + "=" * 60)

    total_eeg = len(eeg_files)
    total_mri = len(mri_files)
    total_fmri = len(fmri_files)
    total_ct = len(ct_files)

    if total_eeg + total_mri + total_fmri + total_ct == 0:
        logger.warning("No real datasets found.")
        logger.info("Ready to add datasets:")
        logger.info("  - Place EEG files in data/raw/eeg/")
        logger.info("  - Place MRI files in data/raw/mri/")
        logger.info("  - Place fMRI files in data/raw/fmri/")
        logger.info("  - Place CT files in data/raw/ct/")
        logger.info("\nUpdate data/metadata/dataset_manifest.csv with file paths.")
    else:
        logger.info(f"Found {total_eeg + total_mri + total_fmri + total_ct} data files")

    logger.info("=" * 60)


if __name__ == "__main__":
    validate_dataset()
