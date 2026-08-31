import os
from glob import glob
from pathlib import Path

import mne
import nibabel as nib
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset

from preprocess_eeg import (
    bandpass_filter_eeg,
    artifact_rejection_amplitude,
    zscore_normalize,
    compute_spectrogram,
)
from preprocess_imaging import (
    normalize_intensity,
    resample_volume,
    skull_strip_volume,
)


DEFAULT_VOLUME_SHAPE = (64, 64, 64)
DEFAULT_EEG_SAMPLING_RATE = 256
DEFAULT_EEG_BANDPASS = (0.5, 45.0)
DEFAULT_AMPLITUDE_THRESHOLD_UV = 150.0


def load_eeg_file(path, sampling_rate=DEFAULT_EEG_SAMPLING_RATE):
    """Load EEG data from EDF, SET, or CSV and return np.ndarray (channels, time)."""
    path = Path(path)
    if path.suffix.lower() in {".edf", ".set"}:
        if path.suffix.lower() == ".edf":
            raw = mne.io.read_raw_edf(str(path), preload=True, verbose=False)
        else:
            raw = mne.io.read_raw_eeglab(str(path), preload=True, verbose=False)
        data = raw.get_data()
        return data

    if path.suffix.lower() == ".csv":
        df = pd.read_csv(path, header=None)
        arr = df.values
        if arr.shape[0] < arr.shape[1]:
            # Assume rows are channels and columns are timesteps
            data = arr.astype(np.float32)
        else:
            # Assume columns are channels
            data = arr.T.astype(np.float32)
        return data

    if path.suffix.lower() == ".eea":
        try:
            from src.preprocessing.eeg import EEGPreprocessor
            prep = EEGPreprocessor({"sampling_frequency": sampling_rate})
            data, _ = prep.load_eeg_file(str(path))
            return data.astype(np.float32)
        except Exception:
            raw_bytes = np.fromfile(str(path), dtype=np.float32)
            n_channels = 19
            n_samples = len(raw_bytes) // n_channels
            if n_samples == 0:
                raw_bytes = np.fromfile(str(path), dtype=np.float64)
                n_samples = len(raw_bytes) // n_channels
            data = raw_bytes[: n_channels * n_samples].reshape(n_channels, n_samples)
            return data.astype(np.float32)

    raise ValueError(f"Unsupported EEG file type: {path.suffix}")


def load_nifti_file(path):
    """Load a NIfTI file and return a numpy volume array."""
    try:
        img = nib.load(str(path))
        data = img.get_fdata(dtype=np.float32)
        if data.ndim == 4:
            data = data[..., 0]
        return data
    except Exception:
        # Fallback to zero volume if corrupted
        return np.zeros(DEFAULT_VOLUME_SHAPE, dtype=np.float32)


def is_valid_nifti(path):
    """Check if NIfTI file is valid and readable."""
    try:
        p = Path(path)
        if not p.exists() or p.stat().st_size < 10000:
            return False
        img = nib.load(str(p))
        _ = img.shape
        return True
    except Exception:
        return False


def build_subject_index(data_dir, labels_csv):
    """Read labels CSV and match subject IDs or pair EEG/imaging files by diagnosis label."""
    labels_path = Path(labels_csv)
    if not labels_path.exists():
        raise FileNotFoundError(f"Labels file not found: {labels_csv}")

    df = pd.read_csv(str(labels_path))
    subset = []
    has_eeg_col = "eeg_path" in df.columns
    has_img_col = "mri_path" in df.columns or "image_path" in df.columns
    img_col_name = "mri_path" if "mri_path" in df.columns else "image_path"

    # Separate by availability
    eeg_by_label = {0: [], 1: []}
    img_by_label = {0: [], 1: []}

    for _, row in df.iterrows():
        sid = str(row.get("subject_id", ""))
        label = int(row.get("label", 0))

        eeg_p = None
        img_p = None

        if has_eeg_col and pd.notna(row.get("eeg_path")) and str(row.get("eeg_path")).strip():
            candidate = Path(str(row["eeg_path"]))
            if candidate.exists() and candidate.stat().st_size > 1000:
                eeg_p = str(candidate)
            elif (Path(data_dir) / candidate).exists() and (Path(data_dir) / candidate).stat().st_size > 1000:
                eeg_p = str(Path(data_dir) / candidate)
            elif (Path("data/raw/eeg") / candidate.name).exists() and (Path("data/raw/eeg") / candidate.name).stat().st_size > 1000:
                eeg_p = str(Path("data/raw/eeg") / candidate.name)

        if has_img_col and pd.notna(row.get(img_col_name)) and str(row.get(img_col_name)).strip():
            candidate = Path(str(row[img_col_name]))
            if is_valid_nifti(candidate):
                img_p = str(candidate)
            elif is_valid_nifti(Path(data_dir) / candidate):
                img_p = str(Path(data_dir) / candidate)

        if eeg_p and img_p:
            subset.append({
                "subject_id": sid,
                "eeg_path": eeg_p,
                "image_path": img_p,
                "label": label,
            })
        else:
            if eeg_p:
                eeg_by_label[label].append((sid, eeg_p))
            if img_p:
                img_by_label[label].append((sid, img_p))

    # If no direct single-subject pairs exist, pair EEG with MRI within the same diagnostic label
    if not subset and (eeg_by_label[0] or eeg_by_label[1]) and (img_by_label[0] or img_by_label[1]):
        for lbl in [0, 1]:
            e_list = eeg_by_label[lbl]
            m_list = img_by_label[lbl]
            if not e_list or not m_list:
                continue
            n_pairs = max(len(e_list), len(m_list))
            for i in range(n_pairs):
                sid_e, ep = e_list[i % len(e_list)]
                sid_m, mp = m_list[i % len(m_list)]
                subset.append({
                    "subject_id": f"{sid_e}+{sid_m}",
                    "eeg_path": ep,
                    "image_path": mp,
                    "label": lbl,
                })

    return subset


def generate_dummy_eeg(
    channels=32,
    timesteps=1024,
    use_spectrogram=False,
    sampling_rate=DEFAULT_EEG_SAMPLING_RATE,
):
    rng = np.random.RandomState(0)
    eeg = rng.normal(scale=1.0, size=(channels, timesteps)).astype(np.float32)
    if use_spectrogram:
        eeg = compute_spectrogram(eeg, sampling_rate)
    return eeg


def generate_dummy_image(volume_shape=DEFAULT_VOLUME_SHAPE):
    rng = np.random.RandomState(1)
    return rng.normal(size=volume_shape).astype(np.float32)


class MultimodalSZDataset(Dataset):
    """PyTorch Dataset for multimodal schizophrenia classification.

    Returns (eeg_tensor, image_tensor, label) per subject.
    Supports EDF/SET/CSV EEG and NIfTI imaging.
    """

    def __init__(
        self,
        data_dir=None,
        labels_csv=None,
        use_spectrogram=False,
        volume_shape=DEFAULT_VOLUME_SHAPE,
        dummy=False,
        dummy_samples=32,
        eeg_sampling_rate=DEFAULT_EEG_SAMPLING_RATE,
        eeg_bandpass=DEFAULT_EEG_BANDPASS,
        amplitude_threshold_uv=DEFAULT_AMPLITUDE_THRESHOLD_UV,
        imaging_intensity_norm="zscore",
        skull_strip=True,
    ):
        self.data_dir = data_dir
        self.labels_csv = labels_csv
        self.use_spectrogram = use_spectrogram
        self.volume_shape = volume_shape
        self.dummy = dummy
        self.eeg_sampling_rate = eeg_sampling_rate
        self.eeg_bandpass = eeg_bandpass
        self.amplitude_threshold_uv = amplitude_threshold_uv
        self.imaging_intensity_norm = imaging_intensity_norm
        self.skull_strip = skull_strip

        if self.dummy:
            self.subjects = [f"dummy_{i:03d}" for i in range(dummy_samples)]
            self.labels = [i % 2 for i in range(dummy_samples)]
            self.metadata = [
                {
                    "subject_id": sid,
                    "eeg_path": None,
                    "image_path": None,
                    "label": self.labels[i],
                }
                for i, sid in enumerate(self.subjects)
            ]
        elif self.labels_csv is not None:
            self.metadata = build_subject_index(self.data_dir, self.labels_csv)
            if not self.metadata:
                raise ValueError(
                    f"No valid subject pairs found under {self.data_dir} with labels {self.labels_csv}"
                )
            self.subjects = [item["subject_id"] for item in self.metadata]
            self.labels = [int(item["label"]) for item in self.metadata]
        else:
            self.metadata = []
            self.subjects = []
            self.labels = []

    def __len__(self):
        return len(self.metadata)

    def __getitem__(self, idx):
        sample = self.metadata[idx]
        label = int(sample["label"])

        if self.dummy:
            eeg = generate_dummy_eeg(
                channels=32,
                timesteps=1024,
                use_spectrogram=self.use_spectrogram,
                sampling_rate=self.eeg_sampling_rate,
            )
            image = generate_dummy_image(self.volume_shape)
        else:
            eeg = load_eeg_file(sample["eeg_path"], sampling_rate=self.eeg_sampling_rate)
            eeg = bandpass_filter_eeg(
                eeg,
                sfreq=self.eeg_sampling_rate,
                low=self.eeg_bandpass[0],
                high=self.eeg_bandpass[1],
            )
            eeg = artifact_rejection_amplitude(eeg, threshold_uv=self.amplitude_threshold_uv)
            eeg = zscore_normalize(eeg)
            if self.use_spectrogram:
                eeg = compute_spectrogram(eeg, self.eeg_sampling_rate)

            image = load_nifti_file(sample["image_path"])
            if self.skull_strip:
                image = skull_strip_volume(image)
            image = resample_volume(image, self.volume_shape)
            image = normalize_intensity(image, method=self.imaging_intensity_norm)

        eeg_tensor = torch.from_numpy(eeg).float()
        image_tensor = torch.from_numpy(image).float().unsqueeze(0)
        return eeg_tensor, image_tensor, torch.tensor(label, dtype=torch.long)

    def get_subject_index(self, subject_id):
        for idx, item in enumerate(self.metadata):
            if item["subject_id"] == subject_id:
                return idx
        raise KeyError(f"Subject ID not found: {subject_id}")

    def load_single_subject(self, eeg_path, image_path):
        """Load one subject from explicit EEG and imaging file paths."""
        eeg = load_eeg_file(eeg_path, sampling_rate=self.eeg_sampling_rate)
        eeg = bandpass_filter_eeg(
            eeg,
            sfreq=self.eeg_sampling_rate,
            low=self.eeg_bandpass[0],
            high=self.eeg_bandpass[1],
        )
        eeg = artifact_rejection_amplitude(eeg, threshold_uv=self.amplitude_threshold_uv)
        eeg = zscore_normalize(eeg)
        if self.use_spectrogram:
            eeg = compute_spectrogram(eeg, self.eeg_sampling_rate)

        image = load_nifti_file(image_path)
        if self.skull_strip:
            image = skull_strip_volume(image)
        image = resample_volume(image, self.volume_shape)
        image = normalize_intensity(image, method=self.imaging_intensity_norm)

        eeg_tensor = torch.from_numpy(eeg).float()
        image_tensor = torch.from_numpy(image).float().unsqueeze(0)
        return eeg_tensor, image_tensor
