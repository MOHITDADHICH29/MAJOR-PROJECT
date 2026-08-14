"""fMRI dataset class."""

import torch
import numpy as np
from typing import Dict, List, Optional
from .base_dataset import BaseDataset
import logging

logger = logging.getLogger(__name__)


class fMRIDataset(BaseDataset):
    """fMRI-specific dataset."""

    def __init__(
        self,
        data_list: List[Dict],
        imaging_config: Dict = None,
        transform=None,
        augmentation=None,
    ):
        """
        Initialize fMRI dataset.

        Args:
            data_list: List of data dictionaries with fMRI paths.
            imaging_config: Imaging configuration.
            transform: Optional transformation.
            augmentation: Optional augmentation.
        """
        super().__init__(data_list, transform, augmentation)
        self.imaging_config = imaging_config or {}
        self.n_rois = self.imaging_config.get("n_rois", 90)

    def __getitem__(self, idx: int) -> Dict:
        """
        Get fMRI sample.

        Args:
            idx: Index.

        Returns:
            Dictionary with fMRI connectivity and label.
        """
        item = self.data_list[idx]

        # Load fMRI data
        fmri_tensor = self._load_fmri(item.get("fmri_path"))

        # Apply transformations
        if self.transform:
            fmri_tensor = self.transform(fmri_tensor)

        # Apply augmentation
        if self.augmentation:
            fmri_tensor = self.augmentation(fmri_tensor)

        return {
            "fmri": fmri_tensor,
            "label": torch.tensor(item.get("label", 0), dtype=torch.long),
            "subject_id": item.get("subject_id", "unknown"),
            "fmri_path": item.get("fmri_path", ""),
        }

    def _load_fmri(self, fmri_path: str) -> torch.Tensor:
        """
        Load fMRI connectivity matrix.

        Args:
            fmri_path: Path to fMRI file.

        Returns:
            Connectivity matrix tensor (n_rois, n_rois).
        """
        if not fmri_path:
            raise ValueError("Missing fMRI path for sample")

        import nibabel as nib

        nifti = nib.load(fmri_path)
        fmri_data = nifti.get_fdata()

        if fmri_data.ndim != 4:
            raise ValueError(f"Expected 4D fMRI volume, got shape {fmri_data.shape}")

        from src.preprocessing import fMRIPreprocessor

        preprocessor = fMRIPreprocessor(self.imaging_config)
        roi_timeseries = preprocessor.extract_roi_timeseries(fmri_data)
        connectivity = np.corrcoef(roi_timeseries)
        return torch.FloatTensor(connectivity)
