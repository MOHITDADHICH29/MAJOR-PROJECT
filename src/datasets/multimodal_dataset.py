"""Multimodal dataset class."""

import torch
import numpy as np
from typing import Dict, List, Optional
from .base_dataset import BaseDataset
from .eeg_dataset import EEGDataset
from .mri_dataset import MRIDataset
from .fmri_dataset import fMRIDataset
from .ct_dataset import CTDataset
import logging

logger = logging.getLogger(__name__)


class MultimodalDataset(BaseDataset):
    """Multimodal dataset combining multiple data types."""

    def __init__(
        self,
        data_list: List[Dict],
        modalities: List[str] = None,
        eeg_config: Dict = None,
        imaging_config: Dict = None,
        transform=None,
        augmentation=None,
    ):
        """
        Initialize multimodal dataset.

        Args:
            data_list: List of data dictionaries with multiple modality paths.
            modalities: List of modalities to use ('eeg', 'mri', 'fmri', 'ct').
            eeg_config: EEG configuration.
            imaging_config: Imaging configuration.
            transform: Optional transformation.
            augmentation: Optional augmentation.
        """
        super().__init__(data_list, transform, augmentation)
        self.modalities = modalities or ["eeg", "mri"]
        self.eeg_config = eeg_config or {}
        self.imaging_config = imaging_config or {}

        # Initialize modality-specific datasets
        self.eeg_dataset = (
            EEGDataset(data_list, eeg_config)
            if "eeg" in self.modalities
            else None
        )
        self.mri_dataset = (
            MRIDataset(data_list, imaging_config)
            if "mri" in self.modalities
            else None
        )
        self.fmri_dataset = (
            fMRIDataset(data_list, imaging_config)
            if "fmri" in self.modalities
            else None
        )
        self.ct_dataset = (
            CTDataset(data_list, imaging_config)
            if "ct" in self.modalities
            else None
        )

    def __getitem__(self, idx: int) -> Dict:
        """
        Get multimodal sample.

        Args:
            idx: Index.

        Returns:
            Dictionary with all available modalities and label.
        """
        sample = {}

        # Load each available modality
        if "eeg" in self.modalities and self.eeg_dataset:
            eeg_sample = self.eeg_dataset[idx]
            sample["eeg"] = eeg_sample["eeg"]

        if "mri" in self.modalities and self.mri_dataset:
            mri_sample = self.mri_dataset[idx]
            sample["mri"] = mri_sample["mri"]

        if "fmri" in self.modalities and self.fmri_dataset:
            fmri_sample = self.fmri_dataset[idx]
            sample["fmri"] = fmri_sample["fmri"]

        if "ct" in self.modalities and self.ct_dataset:
            ct_sample = self.ct_dataset[idx]
            sample["ct"] = ct_sample["ct"]

        # Add label and metadata
        item = self.data_list[idx]
        sample["label"] = torch.tensor(item.get("label", 0), dtype=torch.long)
        sample["subject_id"] = item.get("subject_id", "unknown")
        sample["modalities"] = self.modalities

        return sample

    def get_available_modalities(self) -> List[str]:
        """
        Get list of available modalities.

        Returns:
            List of available modalities.
        """
        return self.modalities

    def get_sample_modality_info(self, idx: int) -> Dict[str, bool]:
        """
        Check which modalities are available for a sample.

        Args:
            idx: Sample index.

        Returns:
            Dictionary indicating available modalities.
        """
        item = self.data_list[idx]
        info = {}

        for modality in ["eeg", "mri", "fmri", "ct"]:
            key = f"{modality}_path"
            info[modality] = bool(item.get(key))

        return info
