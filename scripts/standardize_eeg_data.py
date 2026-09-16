#!/usr/bin/env python3
"""Standardize and cache all 124 EEG files as pre-filtered (0.5-45 Hz) .npy."""

import logging
from pathlib import Path
import numpy as np

import sys
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

from src.utils.manifest import load_manifest, write_manifest
from src.preprocessing.eeg import EEGPreprocessor
from src.utils.paths import resolve_data_path

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def main():
    project_root = Path(__file__).resolve().parents[1]
    manifest_path = project_root / "data" / "metadata" / "dataset_manifest.csv"
    processed_dir = project_root / "data" / "processed" / "eeg" / "standardized"
    processed_dir.mkdir(parents=True, exist_ok=True)

    entries = load_manifest(manifest_path)
    preprocessor = EEGPreprocessor()

    updated_entries = []
    logger.info("Standardizing all EEG files to %s ...", processed_dir)

    for entry in entries:
        eeg_p = entry.get("eeg_path")
        if not eeg_p:
            updated_entries.append(entry)
            continue

        sid = entry["subject_id"]
        out_file = processed_dir / f"{sid}_clean.npy"

        if not out_file.exists():
            try:
                raw_p = resolve_data_path(eeg_p)
                eeg_data, sfreq = preprocessor.load_eeg_file(str(raw_p))
                
                # Apply bandpass filter
                eeg_data = preprocessor.apply_bandpass_filter(eeg_data, 0.5, 45.0)
                
                # Scale-invariant z-score
                mean = np.mean(eeg_data, axis=-1, keepdims=True)
                std = np.std(eeg_data, axis=-1, keepdims=True)
                std = np.where(std < 1e-8, 1.0, std)
                eeg_data = (eeg_data - mean) / std
                
                np.save(out_file, eeg_data.astype(np.float32))
            except Exception as e:
                logger.error("Failed processing %s (%s): %s", sid, eeg_p, e)
                updated_entries.append(entry)
                continue

        entry_copy = dict(entry)
        entry_copy["eeg_path"] = str(out_file.relative_to(project_root)).replace("\\", "/")
        updated_entries.append(entry_copy)

    write_manifest(manifest_path, updated_entries, project_root)
    logger.info("Updated manifest with standardized EEG paths!")


if __name__ == "__main__":
    main()
