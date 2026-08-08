#!/usr/bin/env python3
"""Prepare real EEA data from Schizophrenia directory for training."""

import os
import shutil
import csv
import logging
from pathlib import Path
from typing import List, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def setup_directories() -> Tuple[Path, Path, Path]:
    """Create necessary directory structure."""
    project_root = Path(__file__).parent.parent
    raw_eeg_dir = project_root / "data" / "raw" / "eeg"
    metadata_dir = project_root / "data" / "metadata"
    
    raw_eeg_dir.mkdir(parents=True, exist_ok=True)
    metadata_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"✓ Created {raw_eeg_dir}")
    logger.info(f"✓ Created {metadata_dir}")
    
    return project_root, raw_eeg_dir, metadata_dir


def copy_eea_files(project_root: Path, raw_eeg_dir: Path) -> List[Tuple[str, int, str]]:
    """
    Copy EEA files from Schizophrenia directory to data/raw/eeg/.
    
    Returns:
        List of tuples: (subject_id, label, eeg_path)
    """
    subjects = []
    subject_counter = 1
    
    schizo_root = project_root / "Schizophrenia"
    
    # Process healthy controls (label 0)
    norm_dir = schizo_root / "norm"
    if norm_dir.exists():
        logger.info(f"\nProcessing controls from {norm_dir}...")
        for eea_file in sorted(norm_dir.glob("*.eea")):
            subject_id = f"sub-{subject_counter:03d}"
            dest_path = raw_eeg_dir / eea_file.name
            
            try:
                shutil.copy2(eea_file, dest_path)
                subjects.append((subject_id, 0, str(dest_path.relative_to(project_root))))
                logger.info(f"  ✓ {subject_id}: {eea_file.name} → {dest_path.name}")
                subject_counter += 1
            except Exception as e:
                logger.error(f"  ✗ Failed to copy {eea_file.name}: {e}")
    
    # Process schizophrenia patients (label 1)
    sch_dir = schizo_root / "sch"
    if sch_dir.exists():
        logger.info(f"\nProcessing schizophrenia patients from {sch_dir}...")
        for eea_file in sorted(sch_dir.glob("*.eea")):
            subject_id = f"sub-{subject_counter:03d}"
            dest_path = raw_eeg_dir / eea_file.name
            
            try:
                shutil.copy2(eea_file, dest_path)
                subjects.append((subject_id, 1, str(dest_path.relative_to(project_root))))
                logger.info(f"  ✓ {subject_id}: {eea_file.name} → {dest_path.name}")
                subject_counter += 1
            except Exception as e:
                logger.error(f"  ✗ Failed to copy {eea_file.name}: {e}")
    
    return subjects


def create_manifest(subjects: List[Tuple[str, int, str]], metadata_dir: Path) -> None:
    """Create dataset_manifest.csv with subject information."""
    manifest_path = metadata_dir / "dataset_manifest.csv"
    
    logger.info(f"\nCreating manifest: {manifest_path}")
    
    with open(manifest_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "subject_id", "dataset", "label", "eeg_path", 
            "mri_path", "fmri_path", "ct_path", "age", "sex"
        ])
        
        for subject_id, label, eeg_path in subjects:
            label_name = "control" if label == 0 else "schizophrenia"
            writer.writerow([
                subject_id,           # subject_id
                "Schizophrenia",      # dataset
                label,                # label (0=control, 1=schizophrenia)
                eeg_path,             # eeg_path
                "",                   # mri_path (not available)
                "",                   # fmri_path (not available)
                "",                   # ct_path (not available)
                "",                   # age (not available)
                ""                    # sex (not available)
            ])
    
    logger.info(f"✓ Created manifest with {len(subjects)} subjects")
    
    # Print summary
    controls = sum(1 for _, label, _ in subjects if label == 0)
    schizo = sum(1 for _, label, _ in subjects if label == 1)
    logger.info(f"\nDataset Summary:")
    logger.info(f"  Controls: {controls}")
    logger.info(f"  Schizophrenia: {schizo}")
    logger.info(f"  Total: {len(subjects)}")


def main() -> None:
    """Main function."""
    logger.info("=" * 60)
    logger.info("PREPARING REAL EEA DATA FOR TRAINING")
    logger.info("=" * 60)
    
    try:
        # Setup directories
        project_root, raw_eeg_dir, metadata_dir = setup_directories()
        
        # Copy EEA files
        subjects = copy_eea_files(project_root, raw_eeg_dir)
        
        if not subjects:
            logger.error("No EEA files found!")
            return
        
        # Create manifest
        create_manifest(subjects, metadata_dir)
        
        logger.info("\n" + "=" * 60)
        logger.info("✓ DATA PREPARATION COMPLETE")
        logger.info("=" * 60)
        logger.info("\nNext steps:")
        logger.info("1. Run: python scripts/create_splits.py")
        logger.info("2. Run: python scripts/train.py --modality eeg")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)


if __name__ == "__main__":
    main()
