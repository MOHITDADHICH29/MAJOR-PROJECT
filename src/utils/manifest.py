"""Build and load dataset manifest from Schizophrenia EEG and OpenNeuro ds004302."""

from __future__ import annotations

import csv
import logging
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

logger = logging.getLogger(__name__)

MANIFEST_COLUMNS = [
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

# HC = healthy control (0); AVH-/AVH+ = schizophrenia (1)
DS004302_GROUP_LABELS = {
    "HC": 0,
    "AVH-": 1,
    "AVH+": 1,
}

# 1 = Bipolar (0: non-SZ comparator); 2 = Schizophrenia / Schizoaffective (1: patient)
DS005073_GROUP_LABELS = {
    "1": 0,
    "2": 1,
    1: 0,
    2: 1,
    "Bipolar": 0,
    "Schizophrenia": 1,
    "Schizoaffective": 1,
}


def _rel(project_root: Path, path: Path) -> str:
    return str(path.relative_to(project_root)).replace("\\", "/")


def build_schizophrenia_entries(project_root: Path) -> List[Dict]:
    """Index EEG files from Schizophrenia/norm (controls) and Schizophrenia/sch (patients)."""
    entries: List[Dict] = []
    sch_root = project_root / "Schizophrenia"

    for label, subdir, prefix in (
        (0, "norm", "sch-norm"),
        (1, "sch", "sch-patient"),
    ):
        source_dir = sch_root / subdir
        if not source_dir.exists():
            logger.warning("Schizophrenia directory not found: %s", source_dir)
            continue

        for eea_file in sorted(source_dir.glob("*.eea")):
            stem = eea_file.stem
            entries.append(
                {
                    "subject_id": f"{prefix}-{stem}",
                    "dataset": "Schizophrenia",
                    "label": label,
                    "eeg_path": _rel(project_root, eea_file),
                    "mri_path": "",
                    "fmri_path": "",
                    "ct_path": "",
                    "age": "",
                    "sex": "",
                }
            )

    return entries


def build_ds004302_entries(project_root: Path, bids_root: Optional[Path] = None) -> List[Dict]:
    """Index T1w MRI and task-speech fMRI from OpenNeuro ds004302."""
    bids_root = bids_root or (project_root / "ds004302")
    if not bids_root.exists():
        logger.warning("ds004302 directory not found: %s", bids_root)
        return []

    participants_path = bids_root / "participants.tsv"
    if not participants_path.exists():
        raise FileNotFoundError(f"Missing participants.tsv in {bids_root}")

    participants = pd.read_csv(participants_path, sep="\t", dtype=str)
    entries: List[Dict] = []

    for _, row in participants.iterrows():
        subject_id = row["participant_id"]
        group = row.get("group", "")
        label = DS004302_GROUP_LABELS.get(group)
        if label is None:
            logger.warning("Skipping %s: unknown group %r", subject_id, group)
            continue

        subject_dir = bids_root / subject_id
        mri_candidates = list((subject_dir / "anat").glob(f"{subject_id}_T1w.nii*"))
        fmri_candidates = list((subject_dir / "func").glob(f"{subject_id}_task-*_bold.nii*"))

        if not mri_candidates:
            logger.warning("Skipping %s: no T1w MRI found", subject_id)
            continue

        mri_path = _rel(project_root, mri_candidates[0])
        fmri_path = _rel(project_root, fmri_candidates[0]) if fmri_candidates else ""

        entries.append(
            {
                "subject_id": subject_id,
                "dataset": "ds004302",
                "label": label,
                "eeg_path": "",
                "mri_path": mri_path,
                "fmri_path": fmri_path,
                "ct_path": "",
                "age": row.get("age", "") or "",
                "sex": row.get("sex", "") or "",
            }
        )

    return entries


def build_ds005073_entries(project_root: Path, bids_root: Optional[Path] = None) -> List[Dict]:
    """Index T1w/T2w MRI and resting-state/task fMRI from OpenNeuro ds005073."""
    bids_root = bids_root or (project_root / "ds005073")
    if not bids_root.exists():
        logger.warning("ds005073 directory not found: %s", bids_root)
        return []

    participants_path = bids_root / "participants.tsv"
    if not participants_path.exists():
        raise FileNotFoundError(f"Missing participants.tsv in {bids_root}")

    participants = pd.read_csv(participants_path, sep="\t", dtype=str)
    participants = participants.dropna(subset=["participant_id"])
    entries: List[Dict] = []

    for _, row in participants.iterrows():
        subject_id = str(row["participant_id"]).strip()
        if not subject_id or subject_id == "nan":
            continue
        group = str(row.get("groupID", "")).strip()
        label = DS005073_GROUP_LABELS.get(group)
        if label is None:
            if subject_id.startswith("sub-S"):
                label = 1
            elif subject_id.startswith("sub-B"):
                label = 0
            else:
                logger.warning("Skipping %s: unknown group %r", subject_id, group)
                continue

        subject_dir = bids_root / subject_id
        mri_candidates = [
            p for p in (
                list((subject_dir / "anat").glob(f"{subject_id}_*T1w.nii.gz"))
                + list((subject_dir / "anat").glob(f"{subject_id}_*T2w.nii.gz"))
                + list((subject_dir / "anat").glob(f"{subject_id}_*T1w.nii"))
            )
            if not p.name.endswith(".part") and not p.name.startswith(".tmp")
        ]
        fmri_candidates = [
            p for p in list((subject_dir / "func").glob(f"{subject_id}_task-*_bold.nii*"))
            if not p.name.endswith(".part") and not p.name.startswith(".tmp")
        ]

        mri_path = _rel(project_root, mri_candidates[0]) if mri_candidates else ""
        fmri_path = _rel(project_root, fmri_candidates[0]) if fmri_candidates else ""

        entries.append(
            {
                "subject_id": subject_id,
                "dataset": "ds005073",
                "label": label,
                "eeg_path": "",
                "mri_path": mri_path,
                "fmri_path": fmri_path,
                "ct_path": "",
                "age": str(row.get("age", "")).strip() if pd.notna(row.get("age")) else "",
                "sex": str(row.get("gender", "")).strip() if pd.notna(row.get("gender")) else "",
            }
        )

    return entries


def build_manifest(project_root: Optional[Path] = None) -> List[Dict]:
    """Build combined manifest from Schizophrenia EEG, ds004302, and ds005073 neuroimaging."""
    project_root = project_root or Path(__file__).resolve().parents[2]
    entries = build_schizophrenia_entries(project_root)
    entries.extend(build_ds004302_entries(project_root))
    entries.extend(build_ds005073_entries(project_root))
    return entries


def write_manifest(
    manifest_path: Path,
    entries: List[Dict],
    project_root: Optional[Path] = None,
) -> None:
    """Write manifest CSV."""
    project_root = project_root or manifest_path.parents[2]
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=MANIFEST_COLUMNS)
        writer.writeheader()
        for entry in entries:
            writer.writerow({col: entry.get(col, "") for col in MANIFEST_COLUMNS})

    sch = sum(1 for e in entries if e["dataset"] == "Schizophrenia")
    openneuro = sum(1 for e in entries if e["dataset"] == "ds004302")
    controls = sum(1 for e in entries if e["label"] == 0)
    patients = sum(1 for e in entries if e["label"] == 1)

    logger.info("Wrote manifest: %s", manifest_path)
    logger.info("  Schizophrenia EEG: %d", sch)
    logger.info("  ds004302 MRI/fMRI: %d", openneuro)
    logger.info("  Controls (0): %d", controls)
    logger.info("  Schizophrenia (1): %d", patients)
    logger.info("  Total: %d", len(entries))


def load_manifest(manifest_path: Path | str) -> List[Dict]:
    """Load manifest CSV into list of dicts with typed label."""
    manifest_path = Path(manifest_path)
    if not manifest_path.exists():
        raise FileNotFoundError(
            f"Dataset manifest not found: {manifest_path}. "
            "Run: python scripts/prepare_real_data.py"
        )

    entries: List[Dict] = []
    with open(manifest_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            entries.append(
                {
                    "subject_id": row["subject_id"],
                    "dataset": row["dataset"],
                    "label": int(row["label"]),
                    "eeg_path": row.get("eeg_path") or "",
                    "mri_path": row.get("mri_path") or "",
                    "fmri_path": row.get("fmri_path") or "",
                    "ct_path": row.get("ct_path") or "",
                    "age": row.get("age") or "",
                    "sex": row.get("sex") or "",
                }
            )

    if not entries:
        raise ValueError(f"Manifest is empty: {manifest_path}")

    return entries


def filter_by_modality(entries: List[Dict], modality: str) -> List[Dict]:
    """Return entries that have the requested modality path."""
    path_key = {
        "eeg": "eeg_path",
        "mri": "mri_path",
        "imaging": "mri_path",
        "fmri": "fmri_path",
        "ct": "ct_path",
    }.get(modality)

    if path_key is None:
        if modality == "multimodal":
            return [e for e in entries if e.get("eeg_path") and e.get("mri_path")]
        raise ValueError(f"Unknown modality: {modality}")

    if modality == "multimodal":
        return [e for e in entries if e.get("eeg_path") and e.get("mri_path")]

    return [e for e in entries if e.get(path_key)]


def filter_available(entries: List[Dict], modality: str, min_bytes: int = 10_000) -> List[Dict]:
    """Return entries whose data files exist on disk and pass basic validation."""
    from src.utils.paths import resolve_data_path

    path_key = {
        "eeg": "eeg_path",
        "mri": "mri_path",
        "imaging": "mri_path",
        "fmri": "fmri_path",
        "ct": "ct_path",
    }.get(modality, None)

    if modality == "multimodal":
        keys = ["eeg_path", "mri_path"]
    elif path_key:
        keys = [path_key]
    else:
        raise ValueError(f"Unknown modality: {modality}")

    def _is_valid(path: str) -> bool:
        try:
            resolved = resolve_data_path(path)
            if resolved.stat().st_size < min_bytes:
                return False
            if resolved.suffixes[-2:] == [".nii", ".gz"] or resolved.suffix == ".nii":
                import nibabel as nib

                img = nib.load(str(resolved))
                _ = img.get_fdata(dtype="float32")
            return True
        except Exception:
            return False

    available = []
    for entry in filter_by_modality(entries, modality):
        if all(_is_valid(entry[key]) for key in keys):
            available.append(entry)

    return available
