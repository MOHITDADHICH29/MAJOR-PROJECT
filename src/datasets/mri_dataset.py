"""MRI dataset class."""

import torch
import numpy as np
from typing import Dict, List, Optional
from .base_dataset import BaseDataset
import logging

logger = logging.getLogger(__name__)


class MRIDataset(BaseDataset):
    """MRI-specific dataset."""

    def __init__(
        self,
        data_list: List[Dict],
        imaging_config: Dict = None,
        transform=None,
        augmentation=None,
    ):
        """
        Initialize MRI dataset.

        Args:
            data_list: List of data dictionaries with MRI paths.
            imaging_config: Imaging configuration.
            transform: Optional transformation.
            augmentation: Optional augmentation.
        """
        super().__init__(data_list, transform, augmentation)
        self.imaging_config = imaging_config or {}
        self.target_size = tuple(self.imaging_config.get("target_size", (96, 96, 96)))

    def __getitem__(self, idx: int) -> Dict:
        """
        Get MRI sample.

        Args:
            idx: Index.

        Returns:
            Dictionary with MRI tensor and label.
        """
        item = self.data_list[idx]

        # Load MRI data
        mri_tensor = self._load_mri(item.get("mri_path"))

        # Apply transformations
        if self.transform:
            mri_tensor = self.transform(mri_tensor)

        # Apply augmentation
        if self.augmentation:
            mri_tensor = self.augmentation(mri_tensor)

        return {
            "mri": mri_tensor,
            "label": torch.tensor(item.get("label", 0), dtype=torch.long),
            "subject_id": item.get("subject_id", "unknown"),
            "mri_path": item.get("mri_path", ""),
        }

    def _load_mri(self, mri_path: str) -> torch.Tensor:
        """
        Load MRI data from file.

        Args:
            mri_path: Path to MRI file.

        Returns:
            MRI tensor (1, depth, height, width).
        """
        if not mri_path:
            # Generate synthetic MRI for testing
            from src.utils import SyntheticDataGenerator

            mri_data = SyntheticDataGenerator.generate_mri_tensor(n_samples=1)
            return mri_data[0]

        try:
            import nibabel as nib

            nifti = nib.load(mri_path)
            mri_data = nifti.get_fdata()

            # Add channel dimension if needed
            if mri_data.ndim == 3:
                mri_data = np.expand_dims(mri_data, axis=0)

            # Ensure correct shape
            if mri_data.shape != (1, *self.target_size):
                from src.preprocessing import normalize_tensor, resample_volume

                mri_data = resample_volume(
                    mri_data[0] if mri_data.shape[0] == 1 else mri_data,
                    self.target_size,
                )
                if mri_data.ndim == 3:
                    mri_data = np.expand_dims(mri_data, axis=0)

            return torch.FloatTensor(mri_data)

        except Exception as e:
            logger.warning(f"Failed to load MRI file {mri_path}: {e}")
            # Return synthetic data for testing
            from src.utils import SyntheticDataGenerator

            mri_data = SyntheticDataGenerator.generate_mri_tensor(n_samples=1)
            return mri_data[0]
