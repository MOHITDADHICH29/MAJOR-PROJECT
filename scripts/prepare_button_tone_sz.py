#!/usr/bin/env python3
"""Preprocess and harmonize EEG DATA2 (Button-Tone-SZ) into 19-channel format."""

import logging
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.signal import resample

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

STANDARD_19_CHANNELS = [
    "Fp1", "Fp2", "F3", "F4", "C3", "C4", "P3", "P4", "O1", "O2",
    "F7", "F8", "T7", "T8", "P7", "P8", "Fz", "Cz", "Pz",
]
TARGET_SFREQ = 256
SOURCE_SFREQ = 1024
TARGET_TIMEPOINTS = 14734  # Harmonized with existing Schizophrenia EEG dataset length


def prepare_eeg_data2(project_root: Path = None) -> list:
    project_root = project_root or Path(__file__).resolve().parents[1]
    raw_dir = project_root / "EEG DATA2"
    output_dir = project_root / "data" / "processed" / "eeg" / "eeg_data2"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not raw_dir.exists():
        logger.warning("EEG DATA2 directory not found: %s", raw_dir)
        return []

    # Read column headers
    col_file = raw_dir / "columnLabels.csv"
    if not col_file.exists():
        logger.error("columnLabels.csv not found in %s", raw_dir)
        return []
    
    col_labels = [c.strip() for c in pd.read_csv(col_file).columns.tolist()]
    channel_indices = [col_labels.index(ch) for ch in STANDARD_19_CHANNELS]

    # Read demographic info
    demo_file = raw_dir / "demographic.csv"
    demo_df = pd.read_csv(demo_file)
    demo_df.columns = [c.strip() for c in demo_df.columns]

    processed_entries = []

    for _, row in demo_df.iterrows():
        s_id = int(row["subject"])
        label = int(row["group"])
        age = str(row.get("age", ""))
        sex = str(row.get("gender", ""))

        # Locate raw file
        cand1 = raw_dir / f"{s_id}.csv" / f"{s_id}.csv"
        cand2 = raw_dir / f"{s_id}.csv"
        raw_file = cand1 if cand1.is_file() else (cand2 if cand2.is_file() else None)

        if raw_file is None:
            continue

        out_npy = output_dir / f"sub-sz2-{s_id:02d}.npy"

        if not out_npy.exists():
            logger.info("Processing subject %d from %s ...", s_id, raw_file.name)
            # Read enough rows: target ~60,000 samples at 1024 Hz -> downsample to 14,734 at 256 Hz
            # 14734 * (1024 / 256) = 58936 samples
            n_raw_samples = int(TARGET_TIMEPOINTS * (SOURCE_SFREQ / TARGET_SFREQ))
            df = pd.read_csv(raw_file, header=None, nrows=n_raw_samples)
            
            raw_19 = df.iloc[:, channel_indices].values.T.astype(np.float32)  # (19, n_raw_samples)
            
            # Resample to 256 Hz target length
            resampled_19 = resample(raw_19, TARGET_TIMEPOINTS, axis=-1).astype(np.float32)
            np.save(out_npy, resampled_19)
        
        rel_eeg_path = str(out_npy.relative_to(project_root)).replace("\\", "/")
        processed_entries.append({
            "subject_id": f"sz2-sub-{s_id:02d}",
            "dataset": "EEG_DATA2",
            "label": label,
            "eeg_path": rel_eeg_path,
            "mri_path": "",
            "fmri_path": "",
            "ct_path": "",
            "age": age,
            "sex": sex,
        })

    logger.info("Processed %d subjects from EEG DATA2 (Controls: %d, SZ Patients: %d)",
                len(processed_entries),
                sum(1 for e in processed_entries if e["label"] == 0),
                sum(1 for e in processed_entries if e["label"] == 1))
    return processed_entries


if __name__ == "__main__":
    prepare_eeg_data2()
