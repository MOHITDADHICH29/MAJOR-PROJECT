"""Create stratified train/val/test splits from dataset manifest."""

import logging
import sys
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.manifest import load_manifest, MANIFEST_COLUMNS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_splits(
    manifest_path: Path = Path("data/metadata/dataset_manifest.csv"),
    splits_dir: Path = Path("data/splits"),
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    seed: int = 42,
) -> None:
    """Create subject-level stratified splits."""
    logger.info("Creating data splits from %s", manifest_path)
    entries = load_manifest(manifest_path)
    df = pd.DataFrame(entries)

    splits_dir.mkdir(parents=True, exist_ok=True)

    # Create composite stratification key to guarantee exact 70/15/15 for each modality and label
    df["strat_key"] = df["dataset"].astype(str) + "_" + df["label"].astype(str)

    train_df, temp_df = train_test_split(
        df,
        test_size=(1.0 - train_ratio),
        stratify=df["strat_key"],
        random_state=seed,
    )

    relative_val_ratio = val_ratio / (1.0 - train_ratio)
    val_df, test_df = train_test_split(
        temp_df,
        test_size=(1.0 - relative_val_ratio),
        stratify=temp_df["strat_key"],
        random_state=seed,
    )

    train_df = train_df.drop(columns=["strat_key"])
    val_df = val_df.drop(columns=["strat_key"])
    test_df = test_df.drop(columns=["strat_key"])

    split_map = {
        "train": train_df,
        "validation": val_df,
        "test": test_df,
    }

    for split_name, split_df in split_map.items():
        split_path = splits_dir / f"{split_name}.csv"
        split_df.to_csv(split_path, index=False)
        logger.info("  %s: %d subjects (%.1f%%)", split_name, len(split_df), (len(split_df) / len(df)) * 100)

    logger.info("\nSplit summary:")
    for dataset_name in df["dataset"].unique():
        counts = df[df["dataset"] == dataset_name]["label"].value_counts().to_dict()
        logger.info("  %s: %s", dataset_name, counts)


if __name__ == "__main__":
    create_splits()
