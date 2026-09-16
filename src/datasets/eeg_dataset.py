"""EEG dataset class."""

import torch
import numpy as np
from typing import Dict, List, Tuple, Optional
from .base_dataset import BaseDataset
import logging

logger = logging.getLogger(__name__)


class EEGDataset(BaseDataset):
    """EEG-specific dataset."""

    def __init__(
        self,
        data_list: List[Dict],
        eeg_config: Dict = None,
        transform=None,
        augmentation=None,
    ):
        """
        Initialize EEG dataset.

        Args:
            data_list: List of data dictionaries with EEG paths.
            eeg_config: EEG configuration.
            transform: Optional transformation.
            augmentation: Optional augmentation.
        """
        super().__init__(data_list, transform, augmentation)
        self.eeg_config = eeg_config or {}
        self.expected_channels = self.eeg_config.get("n_channels", 19)

    def __getitem__(self, idx: int) -> Dict:
        """
        Get EEG sample.

        Args:
            idx: Index.

        Returns:
            Dictionary with EEG tensor and label.
        """
        item = self.data_list[idx]

        # Load EEG data
        eeg_tensor = self._load_eeg(item.get("eeg_path"))

        # Apply transformations
        if self.transform:
            eeg_tensor = self.transform(eeg_tensor)

        # Apply augmentation
        if self.augmentation:
            eeg_tensor = self.augmentation(eeg_tensor)

        return {
            "eeg": eeg_tensor,
            "label": torch.tensor(item.get("label", 0), dtype=torch.long),
            "subject_id": item.get("subject_id", "unknown"),
            "eeg_path": item.get("eeg_path", ""),
        }

    def _load_eeg(self, eeg_path: str) -> torch.Tensor:
        """
        Load EEG data from file.

        Args:
            eeg_path: Path to EEG file.

        Returns:
            EEG tensor (channels, timepoints).
        """
        if not eeg_path:
            raise ValueError("Missing EEG path for sample")

        from src.preprocessing.eeg import EEGPreprocessor
        from src.utils.paths import resolve_data_path

        resolved = resolve_data_path(eeg_path)
        if resolved.suffix.lower() == ".npy":
            eeg_data = np.load(str(resolved)).astype(np.float32)
            return torch.from_numpy(eeg_data)

        preprocessor = EEGPreprocessor(self.eeg_config)
        eeg_data, _ = preprocessor.load_eeg_file(str(resolved))
        # Bandpass filter to isolate 0.5-45 Hz physiological EEG frequencies
        eeg_data = preprocessor.apply_bandpass_filter(eeg_data, low_freq=0.5, high_freq=45.0)
        # Per-channel z-score standardization
        mean = np.mean(eeg_data, axis=-1, keepdims=True)
        std = np.std(eeg_data, axis=-1, keepdims=True)
        std = np.where(std < 1e-8, 1.0, std)
        eeg_data = (eeg_data - mean) / std
        return torch.FloatTensor(eeg_data)
