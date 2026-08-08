"""Create data splits for train/val/test."""

import pandas as pd
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_splits():
    """Create train/val/test splits."""
    logger.info("Creating data splits...")

    # Create metadata directory
    metadata_dir = Path("data/metadata")
    metadata_dir.mkdir(parents=True, exist_ok=True)

    splits_dir = Path("data/splits")
    splits_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = metadata_dir / "dataset_manifest.csv"

    # Create empty manifest if it doesn't exist
    if not manifest_path.exists():
        df_manifest = pd.DataFrame(
            columns=[
                "subject_id",
                "dataset",
                "label",
                "eeg_path",
                "mri_path",
                "fmri_path",
                "ct_path",
                "age",
                "sex",
            ]
        )
        df_manifest.to_csv(manifest_path, index=False)
        logger.info(f"Created empty manifest at {manifest_path}")

    # Create empty split files
    for split_name in ["train", "validation", "test"]:
        split_path = splits_dir / f"{split_name}.csv"

        df_split = pd.DataFrame(
            columns=[
                "subject_id",
                "dataset",
                "label",
                "eeg_path",
                "mri_path",
                "fmri_path",
                "ct_path",
            ]
        )
        df_split.to_csv(split_path, index=False)
        logger.info(f"Created {split_name} split at {split_path}")

    logger.info("\n" + "=" * 60)
    logger.info("Split Creation Complete")
    logger.info("=" * 60)
    logger.info("\nNext steps:")
    logger.info("1. Add data to data/raw/")
    logger.info("2. Update data/metadata/dataset_manifest.csv")
    logger.info("3. Re-run this script to populate splits")


if __name__ == "__main__":
    create_splits()
