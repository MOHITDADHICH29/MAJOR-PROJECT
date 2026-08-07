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

    raise ValueError(f"Unsupported EEG file type: {path.suffix}")


def load_nifti_file(path):
    """Load a NIfTI file and return a numpy volume array."""
    img = nib.load(str(path))
    data = img.get_fdata(dtype=np.float32)
    if data.ndim == 4:
        data = data[..., 0]
    return data


def build_subject_index(data_dir, labels_csv):
    """Read labels CSV and match subject IDs to available EEG/imaging files."""
    labels_path = Path(labels_csv)
    if not labels_path.exists():
        raise FileNotFoundError(f"Labels file not found: {labels_csv}")

    df = pd.read_csv(str(labels_path), dtype={"subject_id": str, "label": int})
    subset = []
    for _, row in df.iterrows():
        sid = str(row["subject_id"])
        eeg_glob = Path(data_dir) / "eeg" / f"{sid}.*"
        img_glob = Path(data_dir) / "imaging" / f"{sid}.*"
        eeg_files = glob(str(eeg_glob))
        img_files = glob(str(img_glob))
        if eeg_files and img_files:
            subset.append({
                "subject_id": sid,
                "eeg_path": eeg_files[0],
                "image_path": img_files[0],
                "label": int(row["label"]),
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
        else:
            self.metadata = build_subject_index(self.data_dir, self.labels_csv)
            if not self.metadata:
                raise ValueError(
                    f"No valid subject pairs found under {self.data_dir} with labels {self.labels_csv}"
                )
            self.subjects = [item["subject_id"] for item in self.metadata]
            self.labels = [int(item["label"]) for item in self.metadata]

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
